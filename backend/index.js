// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
const sendEmail = require("./utils/emailService");
const cron = require("node-cron");
const { format } = require("date-fns");

dotenv.config();

// For debugging, log the type of sendEmail to verify it's a function
console.log("Type of sendEmail:", typeof sendEmail);

const app = express();
app.use(express.json());
app.use(cors());

// Import Routes
const userRoutes = require("./routes/users");
const meetingRoutes = require("./routes/meetings");
const availabilityRoutes = require("./routes/availability");
const leavesRoutes = require("./routes/leaves");
const engagementsRoutes = require("./routes/engagements");
const statisticsRoutes = require("./routes/statistics");

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/leaves", leavesRoutes);
app.use("/api/engagements", engagementsRoutes);
app.use("/api/statistics", statisticsRoutes);

app.get("/", (req, res) => res.send("TMS Backend Running"));

// Endpoint to block availability and send an email notification
app.post("/api/availability/block", async (req, res) => {
  try {
    const { user_id, start_time, end_time, status, reason, email } = req.body;
    const availabilityStatus = status || "busy";  

    const newSlot = await pool.query(
      "INSERT INTO availability (user_id, start_time, end_time, status, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, start_time, end_time, availabilityStatus, reason]
    );

    // Send email notification for availability block
    await sendEmail(
      email, 
      "Availability Blocked", 
      `Your availability has been marked as '${availabilityStatus}' from ${start_time} to ${end_time}. Reason: ${reason || "N/A"}`
    );

    res.json(newSlot.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Cron job for meeting reminders: runs every minute (for testing purposes)
// Option 2: Send reminders for any meeting (with start_time in the future) that hasn't been reminded yet
cron.schedule("* * * * *", async () => {
  try {
    // Join meetings with users to get the creator's email as 'user_email'
    const upcomingMeetings = await pool.query(
      `SELECT m.*, u.email AS user_email 
       FROM meetings m 
       JOIN users u ON m.created_by = u.user_id 
       WHERE m.start_time > NOW() AND m.reminder_sent = false`
    );
    
    for (let meeting of upcomingMeetings.rows) {
      // Log which meeting reminder is being sent
      console.log(`Sending reminder for meeting "${meeting.title}" to ${meeting.user_email}`);
      
      await sendEmail(
        meeting.user_email,
        "Meeting Reminder",
        `Reminder: Your meeting "${meeting.title}" is scheduled at ${new Date(meeting.start_time).toLocaleString()}.`
      );
      // Mark the meeting as having had its reminder sent
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

// Uncomment the line below to run the cron job every minute for testing purposes
// cron.schedule("* * * * *", async () => { ... });


// DAILY SCHEDULE EMAIL CRON JOB
// This job runs every day at 7:00 AM and sends each executive their schedule for the day.
// The schedule is compiled from meetings, leaves, and engagements.
cron.schedule("0 8 * * *", async () => {
  try {
    // Get today's date boundaries
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    // Query for all executives (excluding secretaries)
    const execResult = await pool.query("SELECT user_id, name, email FROM users WHERE role = 'executive'");
    const executives = execResult.rows;

    for (const exec of executives) {
      // Query meetings for this executive for today
      const meetingsResult = await pool.query(
        `SELECT 'Meeting' as type, title as description, start_time, end_time, venue 
         FROM meetings m 
         JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id 
         WHERE ma.user_id = $1 AND m.start_time >= $2 AND m.end_time <= $3`,
         [exec.user_id, dayStart, dayEnd]
      );
      // Query leaves for this executive for today
      const leavesResult = await pool.query(
        `SELECT 'Leave' as type, reason as description, leave_start as start_time, leave_end as end_time, NULL as venue
         FROM leaves 
         WHERE executive_id = $1 AND leave_start >= $2 AND leave_end <= $3`,
         [exec.user_id, dayStart, dayEnd]
      );
      // Query engagements for this executive for today
      const engagementsResult = await pool.query(
        `SELECT 'Engagement' as type, description, engagement_start as start_time, engagement_end as end_time, NULL as venue
         FROM engagements
         WHERE executive_id = $1 AND engagement_start >= $2 AND engagement_end <= $3`,
         [exec.user_id, dayStart, dayEnd]
      );
      
      // Combine events
      const events = [
        ...meetingsResult.rows,
        ...leavesResult.rows,
        ...engagementsResult.rows
      ];
      // Sort events by start_time
      events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      // Format today's date as dd/MM/yyyy
      const dateStr = format(dayStart, "dd/MM/yyyy");

      let emailContent = `Your schedule for ${dateStr}:\n\n`;
      if (events.length === 0) {
         emailContent += "No appointments scheduled for today.";
      } else {
         events.forEach(event => {
           const startTime = format(new Date(event.start_time), "HH:mm");
           const endTime = format(new Date(event.end_time), "HH:mm");
           emailContent += `${event.type}: ${event.description ? event.description : ""}`;
           if (event.venue) {
             emailContent += ` (Venue: ${event.venue})`;
           }
           emailContent += `\nTime: ${startTime} - ${endTime}\n\n`;
         });
      }
      
      // Send the daily schedule email to the executive
      await sendEmail(
        exec.email,
        `Your Daily Schedule for ${dateStr}`,
        emailContent
      );
    }
    console.log("Daily schedule emails sent to all executives.");
  } catch (err) {
    console.error("Error sending daily schedule emails:", err);
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
