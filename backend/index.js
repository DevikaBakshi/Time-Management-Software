// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
const sendEmail = require("./utils/emailService");
const cron = require("node-cron");

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
