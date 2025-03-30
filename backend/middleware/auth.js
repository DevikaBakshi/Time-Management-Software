// middleware/auth.js
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ error: "No token provided" });
  
  const token = authHeader.split(" ")[1]; // Assuming format "Bearer <token>"
  if (!token) return res.status(403).json({ error: "No token provided" });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ error: "Failed to authenticate token" });
    req.user = decoded; // decoded contains userId and role
    next();
  });
}

function requireExecutive(req, res, next) {
  if (req.user && req.user.role === "executive") {
    next();
  } else {
    res.status(403).json({ error: "Insufficient permissions" });
  }
}

module.exports = { verifyToken, requireExecutive };