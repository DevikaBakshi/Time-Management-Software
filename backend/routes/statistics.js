// routes/statistics.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// 1. Executive Meeting Time Statistics
// GET /statistics/executive-time?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get("/executive-time", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "start_date and end_date are required" });
    }

    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email,
              SUM(EXTRACT(EPOCH FROM (m.end_time - m.start_time))) AS total_seconds
       FROM users u
       JOIN meeting_attendees ma ON u.user_id = ma.user_id
       JOIN meetings m ON m.meeting_id = ma.meeting_id
       WHERE m.start_time >= $1 
         AND m.end_time <= $2 
         AND u.role = 'executive'
       GROUP BY u.user_id, u.name, u.email`,
      [start_date, end_date]
    );

    const stats = result.rows.map(row => ({
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      total_meeting_hours: (row.total_seconds / 3600).toFixed(2)
    }));

    res.json(stats);
  } catch (err) {
    console.error("Error fetching executive time statistics:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Project Meeting Statistics
// GET /statistics/project?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get("/project", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "start_date and end_date are required" });
    }

    // Only include meetings that were created by an executive
    const result = await pool.query(
      `SELECT m.project_name,
              COUNT(*) AS meeting_count,
              SUM(EXTRACT(EPOCH FROM (m.end_time - m.start_time))/3600) AS total_duration_hours,
              SUM(
                (EXTRACT(EPOCH FROM (m.end_time - m.start_time))/3600) *
                (SELECT COUNT(*) FROM meeting_attendees WHERE meeting_id = m.meeting_id)
              ) AS total_man_hours
       FROM meetings m
       WHERE m.start_time >= $1 
         AND m.end_time <= $2 
         AND m.created_by IN (SELECT user_id FROM users WHERE role = 'executive')
       GROUP BY m.project_name`,
      [start_date, end_date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching project statistics:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Executive Meeting Fraction Statistics
// GET /statistics/executive-fraction?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&working_hours_per_day=8
router.get("/executive-fraction", async (req, res) => {
  try {
    const { start_date, end_date, working_hours_per_day } = req.query;
    if (!start_date || !end_date || !working_hours_per_day) {
      return res.status(400).json({ error: "start_date, end_date and working_hours_per_day are required" });
    }

    // Calculate number of days in period (inclusive)
    const daysResult = await pool.query(
      `SELECT DATE_PART('day', $2::timestamp - $1::timestamp) + 1 AS days`,
      [start_date, end_date]
    );
    const totalDays = daysResult.rows[0].days;
    const totalWorkingHours = working_hours_per_day * totalDays;

    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email,
              SUM(EXTRACT(EPOCH FROM (m.end_time - m.start_time)))/3600 AS meeting_hours
       FROM users u
       JOIN meeting_attendees ma ON u.user_id = ma.user_id
       JOIN meetings m ON m.meeting_id = ma.meeting_id
       WHERE m.start_time >= $1 
         AND m.end_time <= $2
         AND u.role = 'executive'
       GROUP BY u.user_id, u.name, u.email`,
      [start_date, end_date]
    );

    const stats = result.rows.map(row => ({
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      meeting_hours: parseFloat(row.meeting_hours).toFixed(2),
      fraction: (row.meeting_hours / totalWorkingHours).toFixed(2)
    }));

    res.json({ total_working_hours: totalWorkingHours, stats });
  } catch (err) {
    console.error("Error fetching executive fraction statistics:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
