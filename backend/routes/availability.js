const express = require("express");
const pool = require("../db"); // PostgreSQL connection
const router = express.Router();

// Block a time slot
router.post("/block", async (req, res) => {
    const { user_id, start_time, end_time, reason } = req.body;
    try {
        const blockSlot = await pool.query(
            "INSERT INTO availability (user_id, start_time, end_time, reason) VALUES ($1, $2, $3, $4) RETURNING *",
            [user_id, start_time, end_time, reason]
        );
        res.status(201).json(blockSlot.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
