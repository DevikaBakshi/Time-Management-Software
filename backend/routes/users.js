// routes/users.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth"); // Ensure correct path
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Registration Endpoint
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }
  
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Insert new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, role, hashedPassword]
    );
    res.status(201).json({ user: newUser.rows[0] });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Login Endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user in the database
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    const user = userQuery.rows[0];
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, user: { userId: user.user_id, role: user.role } });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET Executives Endpoint
router.get("/", async (req, res) => {
  try {
    const role = req.query.role;
    const usersResult = await pool.query(
      "SELECT user_id, name, email, role FROM users WHERE role = $1",
      [role]
    );
    res.json(usersResult.rows);
  } catch (err) {
    console.error("Error fetching executives:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET Profile Endpoint
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      "SELECT user_id, name, email, role FROM users WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching profile:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// GET Profile Schedule Endpoint – CURRENT DATE ONLY
router.get("/profile/schedule", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    // Get today's start (00:00:00) and end (23:59:59) times
    const dayStart = new Date(today.setHours(0, 0, 0, 0));
    const dayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Query Meetings (only those starting today)
    const meetingQuery = await pool.query(
      `SELECT m.meeting_id AS id, m.title, m.start_time, m.end_time, m.venue, 'Meeting' AS type
       FROM meetings m
       JOIN meeting_attendees ma ON m.meeting_id = ma.meeting_id
       WHERE ma.user_id = $1 AND m.start_time >= $2 AND m.start_time <= $3`,
      [userId, dayStart, dayEnd]
    );

    // Query Leaves for the current day
    const leavesQuery = await pool.query(
      `SELECT id, leave_start AS start_time, leave_end AS end_time, reason, 'Leave' AS type
       FROM leaves
       WHERE executive_id = $1 AND leave_start >= $2 AND leave_start <= $3`,
      [userId, dayStart, dayEnd]
    );

    // Query Engagements for the current day
    const engagementsQuery = await pool.query(
      `SELECT id, engagement_start AS start_time, engagement_end AS end_time, description, 'Engagement' AS type
       FROM engagements
       WHERE executive_id = $1 AND engagement_start >= $2 AND engagement_start <= $3`,
      [userId, dayStart, dayEnd]
    );

    // Combine all events and sort by start time
    const schedule = [
      ...meetingQuery.rows,
      ...leavesQuery.rows,
      ...engagementsQuery.rows
    ].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    res.json(schedule);
  } catch (err) {
    console.error("Error fetching profile schedule:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
