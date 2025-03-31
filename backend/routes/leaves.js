// routes/leaves.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { format } = require("date-fns");
const sendEmail = require("../utils/emailService");
const { verifyToken, requireExecutive } = require("../middleware/auth");

// POST /leaves
// Creates a new leave record after ensuring that the time slot does not conflict
// with existing meetings, engagements, or leaves for the given executive.
router.post("/", verifyToken, requireExecutive, async (req, res) => {
  try {
    const { executive_id, leave_start, leave_end, reason } = req.body;
    
    // Check conflict with meetings (using meeting_attendees)
    const meetingConflict = await pool.query(
      `SELECT m.meeting_id
       FROM meetings m
       JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
       WHERE ma.user_id = $1
         AND (m.start_time, m.end_time) OVERLAPS ($2, $3)`,
      [executive_id, leave_start, leave_end]
    );
    if (meetingConflict.rows.length > 0) {
      return res.status(400).json({ error: "Time slot conflict with existing meetings." });
    }
    
    // Check conflict with engagements
    const engagementConflict = await pool.query(
      `SELECT id
       FROM engagements
       WHERE executive_id = $1
         AND (engagement_start, engagement_end) OVERLAPS ($2, $3)`,
      [executive_id, leave_start, leave_end]
    );
    if (engagementConflict.rows.length > 0) {
      return res.status(400).json({ error: "Time slot conflict with existing engagements." });
    }
    
    // Check conflict with other leaves
    const leaveConflict = await pool.query(
      `SELECT id
       FROM leaves
       WHERE executive_id = $1
         AND (leave_start, leave_end) OVERLAPS ($2, $3)`,
      [executive_id, leave_start, leave_end]
    );
    if (leaveConflict.rows.length > 0) {
      return res.status(400).json({ error: "Time slot conflict with existing leave." });
    }
    
    // If no conflicts, insert the new leave record
    const result = await pool.query(
      "INSERT INTO leaves (executive_id, leave_start, leave_end, reason) VALUES ($1, $2, $3, $4) RETURNING *",
      [executive_id, leave_start, leave_end, reason]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error creating leave:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// GET /leaves/find-slot
// Returns available free intervals for an executive on a given date
// for scheduling a leave. It takes into account busy intervals from:
//   - Meetings (via meeting_attendees)
//   - Engagements
//   - Existing leaves
// If the target date is today, only intervals from now onward are considered.
router.get("/find-slot", async (req, res) => {
  try {
    const { date, executive_id } = req.query;
    if (!date || !executive_id) {
      return res.status(400).json({ error: "executive_id and date are required" });
    }
    
    let targetDate = new Date(date);
    const now = new Date();
    const isToday = now.toDateString() === targetDate.toDateString();
    
    // For today, free time starts from now; otherwise, from midnight.
    let dayStart = isToday ? now : new Date(targetDate.setHours(0, 0, 0, 0));
    let dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));
    
    let busyIntervals = [];
    
    // 1. Meetings busy intervals
    const meetingQuery = await pool.query(
      `SELECT m.start_time, m.end_time
       FROM meetings m
       JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
       WHERE ma.user_id = $1
         AND m.start_time < $2
         AND m.end_time > $3
       ORDER BY m.start_time ASC`,
      [executive_id, dayEnd, dayStart]
    );
    busyIntervals = busyIntervals.concat(
      meetingQuery.rows.map(row => ({
        start: new Date(row.start_time),
        end: new Date(row.end_time)
      }))
    );
    
    // 2. Engagements busy intervals
    const engagementQuery = await pool.query(
      `SELECT engagement_start AS start_time, engagement_end AS end_time
       FROM engagements
       WHERE executive_id = $1
         AND engagement_start < $2
         AND engagement_end > $3
       ORDER BY engagement_start ASC`,
      [executive_id, dayEnd, dayStart]
    );
    busyIntervals = busyIntervals.concat(
      engagementQuery.rows.map(row => ({
        start: new Date(row.start_time),
        end: new Date(row.end_time)
      }))
    );
    
    // 3. Leaves busy intervals
    const leaveQuery = await pool.query(
      `SELECT leave_start AS start_time, leave_end AS end_time
       FROM leaves
       WHERE executive_id = $1
         AND leave_start < $2
         AND leave_end > $3
       ORDER BY leave_start ASC`,
      [executive_id, dayEnd, dayStart]
    );
    busyIntervals = busyIntervals.concat(
      leaveQuery.rows.map(row => ({
        start: new Date(row.start_time),
        end: new Date(row.end_time)
      }))
    );
    
    // Sort busy intervals by start time
    busyIntervals.sort((a, b) => a.start - b.start);
    
    // Merge overlapping intervals
    let mergedBusy = [];
    busyIntervals.forEach(interval => {
      if (mergedBusy.length === 0) {
        mergedBusy.push(interval);
      } else {
        let last = mergedBusy[mergedBusy.length - 1];
        if (interval.start <= last.end) {
          last.end = new Date(Math.max(last.end, interval.end));
        } else {
          mergedBusy.push(interval);
        }
      }
    });
    
    // Compute free intervals as gaps between merged busy intervals
    let freeIntervals = [];
    let previousEnd = dayStart;
    mergedBusy.forEach(interval => {
      if (interval.start > previousEnd) {
        freeIntervals.push({ start: previousEnd, end: interval.start });
      }
      previousEnd = new Date(Math.max(previousEnd, interval.end));
    });
    if (previousEnd < dayEnd) {
      freeIntervals.push({ start: previousEnd, end: dayEnd });
    }
    
    // Filter out intervals shorter than 1 minute (60000 ms)
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
    console.error("Error fetching free intervals for leave:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /leaves/:id
// Fetches a single leave record by its primary key "id".
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM leaves WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Leave not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching leave:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});



// PUT /leaves/:id - Update (reschedule) a leave record
// PUT /leaves/:id - Update (reschedule) a leave record
router.put("/:id", verifyToken, requireExecutive, async (req, res) => {
  try {
    const { id } = req.params;
    const { engagement_start, engagement_end, description } = req.body;
    const executive_id = req.user.userId; // use logged-in user's ID

    // Fetch the existing engagement record
    const engagementResult = await pool.query(
      "SELECT * FROM engagements WHERE id = $1",
      [id]
    );
    if (engagementResult.rows.length === 0) {
      return res.status(404).json({ error: "Engagement not found" });
    }
    const engagementRecord = engagementResult.rows[0];
    // Ensure that the engagement belongs to the logged-in executive
    if (engagementRecord.executive_id.toString() !== executive_id.toString()) {
      return res.status(403).json({ error: "Only the engagement creator can update this engagement." });
    }

    // Conflict check with meetings for the executive
    const meetingConflict = await pool.query(
      `SELECT m.meeting_id, m.start_time, m.end_time
       FROM meetings m
       JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
       WHERE ma.user_id = $1
         AND (m.start_time, m.end_time) OVERLAPS ($2, $3)`,
      [executive_id, engagement_start, engagement_end]
    );
    if (meetingConflict.rows.length > 0) {
      return res.status(400).json({
        error: "Time slot conflict with existing meetings.",
        conflicts: meetingConflict.rows
      });
    }

    // Conflict check with leaves for the executive
    const leaveConflict = await pool.query(
      `SELECT id
       FROM leaves
       WHERE executive_id = $1
         AND (leave_start, leave_end) OVERLAPS ($2, $3)`,
      [executive_id, engagement_start, engagement_end]
    );
    if (leaveConflict.rows.length > 0) {
      return res.status(400).json({ error: "Time slot conflict with existing leave." });
    }

    // Conflict check with other engagements (excluding current engagement)
    const engagementConflict = await pool.query(
      `SELECT id
       FROM engagements
       WHERE executive_id = $1
         AND id <> $2
         AND (engagement_start, engagement_end) OVERLAPS ($3, $4)`,
      [executive_id, id, engagement_start, engagement_end]
    );
    if (engagementConflict.rows.length > 0) {
      return res.status(400).json({ error: "Time slot conflict with existing engagements." });
    }

    // If no conflicts, update the engagement record
    const updateResult = await pool.query(
      "UPDATE engagements SET engagement_start = $1, engagement_end = $2, description = $3 WHERE id = $4 RETURNING *",
      [engagement_start, engagement_end, description, id]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error("Error updating engagement:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================
   DELETE /engagements/:id
   Deletes an engagement by its ID.
   ============================================ */
   router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM leaves WHERE id = $1", [id]);
      res.json({ message: "Leave deleted successfully." });
    } catch (err) {
      console.error("Error deleting leave:", err.message);
      res.status(500).json({ error: "Server error" });
    }
  });
  
module.exports = router;
