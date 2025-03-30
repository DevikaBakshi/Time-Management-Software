// routes/meetings.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { format } = require("date-fns");
const sendEmail = require("../utils/emailService");
const { verifyToken, requireExecutive } = require("../middleware/auth");
const cron = require("node-cron");

/* ============================================
   GET /all
   Returns all meetings with aggregated attendee IDs.
   ============================================ */
router.get("/all", async (req, res) => {
  try {
    const meetingsResult = await pool.query(`
      SELECT m.meeting_id, m.title, m.start_time, m.end_time, m.venue, m.project_name, m.created_by,
             COALESCE(array_agg(ma.user_id) FILTER (WHERE ma.user_id IS NOT NULL), '{}') AS attendee_ids
      FROM meetings m
      LEFT JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
      GROUP BY m.meeting_id
      ORDER BY m.start_time ASC
    `);
    res.json(meetingsResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================
   POST /create
   Create Meeting (Only Executives)
   Accepts meeting details along with an "attendees" array of additional executive invitees.
   ============================================ */
router.post("/create", verifyToken, requireExecutive, async (req, res) => {
  try {
    const { title, start_time, end_time, venue, project_name, created_by, attendees } = req.body;
    
    // Combine the organizer and additional attendees
    const allAttendees = [created_by, ...(attendees || [])];

    // Check conflicts for each attendee
    for (const userId of allAttendees) {
      const conflictQuery = await pool.query(
        `SELECT m.meeting_id, m.title, m.start_time, m.end_time
         FROM meetings m
         JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
         WHERE ma.user_id = $1 AND (m.start_time, m.end_time) OVERLAPS ($2, $3)`,
        [userId, start_time, end_time]
      );
      if (conflictQuery.rows.length > 0) {
        return res.status(400).json({ 
          error: "Time slot conflict for one or more attendees. Please choose a different time.",
          conflicts: conflictQuery.rows
        });
      }
    }

    // Insert the meeting record
    const meetingResult = await pool.query(
      "INSERT INTO meetings (title, start_time, end_time, venue, project_name, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, start_time, end_time, venue, project_name, created_by]
    );
    const meeting = meetingResult.rows[0];

    // Insert each attendee (including the organizer) into meeting_attendees
    for (const userId of allAttendees) {
      await pool.query(
        "INSERT INTO meeting_attendees (meeting_id, user_id) VALUES ($1, $2)",
        [meeting.meeting_id, userId]
      );
    }

    // (Optional) Send confirmation emails to all participants.
    res.json(meeting);
  } catch (err) {
    console.error("Error creating meeting:", err);
    res.status(500).json({ error: "Server error" });
  }
});


   /* ============================================
   GET /find-slot
   Find Available Slots Endpoint (Common Slot Detection)
   - For today: free time from now until end of day.
   - For a future date: full day (00:00 to 23:59:59.999).
   - Returns free intervals (gaps) with duration >= 1 minute.
   If no available slot is found, a record is inserted into the 
   manual_intervention_requests table with the meeting date and a list
   of executives involved (scheduler and additional attendees) and an email 
   is sent to the secretary.
   ============================================ */
router.get("/find-slot", async (req, res) => {
  try {
    // Expected query parameters: date, attendees (comma-separated IDs), schedulerId, meetingId (optional)
    // Note: Meeting title is no longer considered.
    const { date, attendees, schedulerId, meetingId } = req.query;
    let targetDate = date ? new Date(date) : new Date();
    const now = new Date();
    const isToday = now.toDateString() === targetDate.toDateString();

    let dayStart = isToday ? now : new Date(targetDate.setHours(0, 0, 0, 0));
    let dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    let busyIntervals = [];
    if (attendees) {
      const attendeeIds = attendees.split(",").map(id => parseInt(id.trim(), 10));
      // Query busy intervals from meetings
      const busyQuery = await pool.query(
        `SELECT m.start_time, m.end_time
         FROM meetings m
         JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
         WHERE ma.user_id = ANY($1)
           AND m.start_time < $2
           AND m.end_time > $3
         ORDER BY m.start_time ASC`,
         [attendeeIds, dayEnd, dayStart]
      );
      busyIntervals = busyQuery.rows.map(row => ({
        start: new Date(row.start_time),
        end: new Date(row.end_time)
      }));
      
      // Additionally, query busy intervals from leaves
      const leavesQuery = await pool.query(
        `SELECT leave_start AS start_time, leave_end AS end_time
         FROM leaves
         WHERE executive_id = ANY($1)
           AND leave_start < $2
           AND leave_end > $3`,
         [attendeeIds, dayEnd, dayStart]
      );
      const leaveIntervals = leavesQuery.rows.map(row => ({
        start: new Date(row.start_time),
        end: new Date(row.end_time)
      }));
      
      // And query busy intervals from engagements
      const engagementsQuery = await pool.query(
        `SELECT engagement_start AS start_time, engagement_end AS end_time
         FROM engagements
         WHERE executive_id = ANY($1)
           AND engagement_start < $2
           AND engagement_end > $3`,
         [attendeeIds, dayEnd, dayStart]
      );
      const engagementIntervals = engagementsQuery.rows.map(row => ({
        start: new Date(row.start_time),
        end: new Date(row.end_time)
      }));
      
      busyIntervals = busyIntervals.concat(leaveIntervals, engagementIntervals);
    } else {
      const busyQuery = await pool.query(
        `SELECT start_time, end_time
         FROM meetings
         WHERE start_time < $1 AND end_time > $2
         ORDER BY start_time ASC`,
         [dayEnd, dayStart]
      );
      busyIntervals = busyQuery.rows.map(row => ({
        start: new Date(row.start_time),
        end: new Date(row.end_time)
      }));
    }

    // Sort busy intervals by start time
    busyIntervals.sort((a, b) => a.start - b.start);

    // Merge overlapping intervals
    let mergedBusy = [];
    for (const interval of busyIntervals) {
      if (!mergedBusy.length) {
        mergedBusy.push(interval);
      } else {
        let last = mergedBusy[mergedBusy.length - 1];
        if (interval.start <= last.end) {
          last.end = new Date(Math.max(last.end, interval.end));
        } else {
          mergedBusy.push(interval);
        }
      }
    }

    // Compute free intervals as gaps between merged busy intervals within the day
    let freeIntervals = [];
    let previousEnd = dayStart;
    for (const interval of mergedBusy) {
      if (interval.start > previousEnd) {
        freeIntervals.push({ start: previousEnd, end: interval.start });
      }
      previousEnd = new Date(Math.max(previousEnd, interval.end));
    }
    if (previousEnd < dayEnd) {
      freeIntervals.push({ start: previousEnd, end: dayEnd });
    }

    // Filter out free intervals with duration less than 1 minute (60000 ms)
    freeIntervals = freeIntervals.filter(interval => (interval.end - interval.start) >= 60000);

    const availableSlots = freeIntervals.map(interval => ({
      start: format(interval.start, "eee, MMM d, yyyy, hh:mm a"),
      end: format(interval.end, "eee, MMM d, yyyy, hh:mm a"),
      startISO: format(interval.start, "yyyy-MM-dd'T'HH:mm"),
      endISO: format(interval.end, "yyyy-MM-dd'T'HH:mm")
    }));

    if (availableSlots.length === 0) {
      // Build manual intervention details (without meeting title)
      let manualDetails = {
        meetingDate: targetDate.toDateString(),
        executivesInvolved: []
      };

      // Query scheduler details from the logged-in user's info (schedulerId)
      if (schedulerId) {
        const schedulerResult = await pool.query("SELECT name, email FROM users WHERE user_id = $1", [schedulerId]);
        if (schedulerResult.rows.length > 0) {
          const scheduler = schedulerResult.rows[0];
          manualDetails.executivesInvolved.push({ name: scheduler.name, email: scheduler.email });
        }
      }
      if (attendees) {
        const attendeeIds = attendees.split(",").map(id => parseInt(id.trim(), 10));
        const execResult = await pool.query("SELECT name, email FROM users WHERE user_id = ANY($1)", [attendeeIds]);
        manualDetails.executivesInvolved = manualDetails.executivesInvolved.concat(execResult.rows);
      }

      // Insert into manual_intervention_requests table
      await pool.query(
        "INSERT INTO manual_intervention_requests (meeting_date, executives_involved) VALUES ($1, $2)",
        [targetDate, JSON.stringify(manualDetails.executivesInvolved)]
      );

      // Send email to the secretary with the details
      const secretaryEmail = process.env.SECRETARY_EMAIL;
      if (secretaryEmail) {
        let emailBody = `Meeting Date: ${targetDate.toDateString()}\n`;
        emailBody += `Executives Involved: ${
          manualDetails.executivesInvolved.length > 0
            ? manualDetails.executivesInvolved.map(exec => `${exec.name} (${exec.email})`).join(", ")
            : "Not Provided"
        }\n\n`;
        emailBody += "No common free slot was found for the selected executives. Please review their schedules for rescheduling.";
        await sendEmail(secretaryEmail, "No Common Slot Available", emailBody);
      }
      return res.status(404).json({ 
        error: "No available slots found. Manual intervention required.",
        manualInterventionDetails: manualDetails
      });
    }

    res.json({ availableSlots });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
  

/* ============================================
   GET /schedules
   Returns an executive's schedule for a given date.
   Query parameters: user_id, date (YYYY-MM-DD)
   ============================================ */
router.get("/schedules", async (req, res) => {
  try {
    const { user_id, date } = req.query;
    if (!user_id || !date) {
      return res.status(400).json({ error: "user_id and date are required" });
    }
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const scheduleResult = await pool.query(`
      SELECT m.meeting_id, m.title, m.start_time, m.end_time, m.venue, m.project_name, m.created_by
      FROM meetings m
      JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
      WHERE ma.user_id = $1 AND m.start_time >= $2 AND m.end_time <= $3
      ORDER BY m.start_time ASC
    `, [user_id, dayStart, dayEnd]);

    res.json(scheduleResult.rows);
  } catch (err) {
    console.error("Error fetching schedule:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================
   GET /free-intervals
   Returns free intervals for an executive on a given date.
   Query parameters: user_id, date (YYYY-MM-DD)
   ============================================ */
// routes/meetings.js (Free Intervals Endpoint)
router.get("/free-intervals", async (req, res) => {
  try {
    const { user_id, date } = req.query;
    if (!user_id || !date) {
      return res.status(400).json({ error: "user_id and date are required" });
    }
    
    const targetDate = new Date(date);
    // Set day start and end for the target date
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    // 1. Get busy intervals from meetings
    const busyQuery = await pool.query(`
      SELECT m.start_time, m.end_time
      FROM meetings m
      JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
      WHERE ma.user_id = $1 
        AND m.start_time < $2 
        AND m.end_time > $3
      ORDER BY m.start_time ASC
    `, [user_id, dayEnd, dayStart]);
    let busyIntervals = busyQuery.rows.map(row => ({
      start: new Date(row.start_time),
      end: new Date(row.end_time)
    }));

    // 2. Get busy intervals from leaves
    const leavesQuery = await pool.query(`
      SELECT leave_start AS start_time, leave_end AS end_time
      FROM leaves
      WHERE executive_id = $1 
        AND leave_start < $2 
        AND leave_end > $3
      ORDER BY leave_start ASC
    `, [user_id, dayEnd, dayStart]);
    const leaveIntervals = leavesQuery.rows.map(row => ({
      start: new Date(row.start_time),
      end: new Date(row.end_time)
    }));

    // 3. Get busy intervals from engagements
    const engagementsQuery = await pool.query(`
      SELECT engagement_start AS start_time, engagement_end AS end_time
      FROM engagements
      WHERE executive_id = $1 
        AND engagement_start < $2 
        AND engagement_end > $3
      ORDER BY engagement_start ASC
    `, [user_id, dayEnd, dayStart]);
    const engagementIntervals = engagementsQuery.rows.map(row => ({
      start: new Date(row.start_time),
      end: new Date(row.end_time)
    }));

    // Combine all busy intervals
    busyIntervals = busyIntervals.concat(leaveIntervals, engagementIntervals);
    busyIntervals.sort((a, b) => a.start - b.start);

    // Merge overlapping busy intervals
    let mergedBusy = [];
    for (const interval of busyIntervals) {
      if (!mergedBusy.length) {
        mergedBusy.push(interval);
      } else {
        let last = mergedBusy[mergedBusy.length - 1];
        if (interval.start <= last.end) {
          last.end = new Date(Math.max(last.end, interval.end));
        } else {
          mergedBusy.push(interval);
        }
      }
    }

    // Compute free intervals between merged busy intervals within the day
    let freeIntervals = [];
    let previousEnd = dayStart;
    for (const interval of mergedBusy) {
      if (interval.start > previousEnd) {
        freeIntervals.push({ start: previousEnd, end: interval.start });
      }
      previousEnd = new Date(Math.max(previousEnd, interval.end));
    }
    if (previousEnd < dayEnd) {
      freeIntervals.push({ start: previousEnd, end: dayEnd });
    }

    // Filter free intervals to only include those with a duration of at least 1 minute (60000 ms)
    freeIntervals = freeIntervals.filter(interval => (interval.end - interval.start) >= 60000);

    const availableIntervals = freeIntervals.map(interval => ({
      start: format(interval.start, "eee, MMM d, yyyy, hh:mm a"),
      end: format(interval.end, "eee, MMM d, yyyy, hh:mm a"),
      startISO: format(interval.start, "yyyy-MM-dd'T'HH:mm"),
      endISO: format(interval.end, "yyyy-MM-dd'T'HH:mm")
    }));

    if (availableIntervals.length === 0) {
      return res.status(404).json({ error: "No free intervals found for the specified executive" });
    }

    res.json({ availableIntervals });
  } catch (err) {
    console.error("Error fetching free intervals:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/* ============================================
   GET /secretary-dashboard
   Returns meetings flagged as needing manual intervention from the manual_intervention_requests table.
   ============================================ */
router.get("/secretary-dashboard", async (req, res) => {
  try {
    const dashboardResult = await pool.query(`
      SELECT id, meeting_date, executives_involved, created_at
      FROM manual_intervention_requests
      ORDER BY created_at DESC
    `);
    res.json(dashboardResult.rows);
  } catch (err) {
    console.error("Error fetching secretary dashboard data:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================
   GET /:id
   Get Meeting Details Endpoint
   Returns full details including:
     - Meeting data,
     - Organizer details as a JSON object,
     - Attendees list as an array of JSON objects,
     - Aggregated attendee IDs as attendee_ids.
   ============================================ */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const meetingResult = await pool.query(
      `
      SELECT m.*, 
             row_to_json(org) AS organizer,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'user_id', u.user_id,
                   'name', u.name,
                   'email', u.email
                 )
               ) FILTER (WHERE u.user_id IS NOT NULL), '[]'
             ) AS attendees,
             COALESCE(
               array_agg(u.user_id) FILTER (WHERE u.user_id IS NOT NULL), '{}'
             ) AS attendee_ids
      FROM meetings m
      LEFT JOIN users org ON m.created_by = org.user_id
      LEFT JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
      LEFT JOIN users u ON ma.user_id = u.user_id AND u.user_id <> m.created_by
      WHERE m.meeting_id = $1
      GROUP BY m.meeting_id, org
      `,
      [id]
    );
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json(meetingResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================
   PUT /:id
   Reschedule Meeting Endpoint
   - Only the meeting creator can reschedule.
   - Expects new start_time, end_time, and venue in the request body.
   - Updates the meeting record.
   - Sends reschedule emails to all attendees (excluding the scheduler).
   ============================================ */
router.put("/:id", verifyToken, requireExecutive, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, venue } = req.body;
    const userId = req.user.userId;
    
    // Fetch meeting details
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE meeting_id = $1", [id]);
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    const meeting = meetingResult.rows[0];
    
    // Only the meeting creator can reschedule
    if (meeting.created_by.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the meeting creator can reschedule this meeting." });
    }
    
    // (Optional) Add conflict checking here if needed
    
    // Update the meeting record
    const updateResult = await pool.query(
      "UPDATE meetings SET start_time = $1, end_time = $2, venue = $3 WHERE meeting_id = $4 RETURNING *",
      [start_time, end_time, venue, id]
    );
    const updatedMeeting = updateResult.rows[0];
    
    // Fetch all attendees (excluding the scheduler)
    const attendeesResult = await pool.query(
      `SELECT u.email, u.name 
       FROM meeting_attendees ma 
       JOIN users u ON ma.user_id = u.user_id 
       WHERE ma.meeting_id = $1 AND u.user_id <> $2`,
      [id, userId]
    );
    const attendees = attendeesResult.rows;
    
    // Fetch scheduler details
    const schedulerResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
    const scheduler = schedulerResult.rows[0];
    
    // Send reschedule emails to each attendee (excluding the scheduler)
    for (const attendee of attendees) {
      await sendEmail(
        attendee.email,
        "Meeting Rescheduled",
        `Dear ${attendee.name},\n\nPlease note that the meeting "${updatedMeeting.title}" has been rescheduled by ${scheduler.name}.\nNew Timing: ${new Date(updatedMeeting.start_time).toLocaleString()} to ${new Date(updatedMeeting.end_time).toLocaleString()}.\nNew Venue: ${venue}\n\nRegards,\nTMS Team`
      );
    }
    
    res.json(updatedMeeting);
  } catch (err) {
    console.error("Error rescheduling meeting:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================
   DELETE /:id
   Cancel a Meeting Endpoint
   - Only the meeting creator can cancel the meeting.
   - Sends cancellation emails to all attendees (excluding the scheduler) before deleting.
   ============================================ */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Fetch meeting details
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE meeting_id = $1", [id]);
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    const meeting = meetingResult.rows[0];
    
    // Only the meeting creator can cancel the meeting
    if (meeting.created_by.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the meeting creator can cancel this meeting." });
    }
    
    // Fetch all attendees (excluding the creator)
    const attendeesResult = await pool.query(
      `SELECT u.email, u.name 
       FROM meeting_attendees ma 
       JOIN users u ON ma.user_id = u.user_id 
       WHERE ma.meeting_id = $1 AND u.user_id <> $2`,
      [id, userId]
    );
    const attendees = attendeesResult.rows;
    
    // Fetch scheduler details
    const schedulerResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
    const scheduler = schedulerResult.rows[0];
    
    // Send cancellation emails to each attendee (excluding the scheduler)
    for (const attendee of attendees) {
      await sendEmail(
        attendee.email,
        "Meeting Cancelled",
        `Dear ${attendee.name},\n\nThe meeting "${meeting.title}" scheduled on ${new Date(meeting.start_time).toLocaleString()} has been cancelled by ${scheduler.name}.\n\nRegards,\nTMS Team`
      );
    }
    
    // Delete meeting attendees records first, then the meeting record
    await pool.query("DELETE FROM meeting_attendees WHERE meeting_id = $1", [id]);
    await pool.query("DELETE FROM meetings WHERE meeting_id = $1", [id]);
    
    res.json({ message: "Meeting cancelled successfully." });
  } catch (err) {
    console.error("Error cancelling meeting:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// In routes/meetings.js (or you could create a separate file like routes/secretary.js)

router.post("/secretary/send-email", async (req, res) => {
  try {
    const { recipients, subject, message, date } = req.body;

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "No executive IDs provided." });
    }
    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required." });
    }

    // Query the database for the executives' details
    const execResult = await pool.query(
      "SELECT email, name FROM users WHERE user_id = ANY($1)",
      [recipients]
    );
    const executives = execResult.rows;

    // Build email content, including date info if provided
    let emailContent = message;
    if (date) {
      emailContent = `Date: ${new Date(date).toDateString()}\n\n${message}`;
    }

    // Send an email to each executive
    for (const exec of executives) {
      await sendEmail(
        exec.email,
        subject,
        `Dear ${exec.name},\n\n${emailContent}\n\nRegards,\nSecretary`
      );
    }

    res.json({ message: "Emails sent successfully to selected executives." });
  } catch (err) {
    console.error("Error sending secretary email:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// DELETE /secretary/manual/:id
router.delete("/secretary/manual/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Delete the record from the manual_intervention_requests table
    await pool.query("DELETE FROM manual_intervention_requests WHERE id = $1", [id]);
    res.json({ message: "Record deleted successfully." });
  } catch (err) {
    console.error("Error deleting manual intervention record:", err);
    res.status(500).json({ error: "Server error" });
  }
});



/* ============================================
   Cron Job for Meeting Reminders
   This job runs every minute (for testing) to send reminder emails to all meeting participants,
   then marks the meeting as having received its reminder.
   ============================================ */
cron.schedule("* * * * *", async () => {
  try {
    const upcomingMeetings = await pool.query(`
      SELECT m.meeting_id, m.title, m.start_time, m.reminder_sent,
             array_agg(u.email) AS participant_emails
      FROM meetings m
      JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
      JOIN users u ON ma.user_id = u.user_id
      WHERE m.start_time > NOW() AND m.reminder_sent = false
      GROUP BY m.meeting_id, m.title, m.start_time, m.reminder_sent
    `);
    
    for (const meeting of upcomingMeetings.rows) {
      for (const email of meeting.participant_emails) {
        await sendEmail(
          email,
          "Meeting Reminder",
          `Reminder: Your meeting "${meeting.title}" is scheduled at ${new Date(meeting.start_time).toLocaleString()}.`
        );
      }
      await pool.query(
        "UPDATE meetings SET reminder_sent = true WHERE meeting_id = $1",
        [meeting.meeting_id]
      );
    }
    console.log("Reminders sent for upcoming meetings.");
  } catch (err) {
    console.error("Error sending meeting reminders:", err);
  }
});

module.exports = router;


