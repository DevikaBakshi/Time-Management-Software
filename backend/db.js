const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "tms",
  password: process.env.DB_PASSWORD || "your_db_password",
  port: process.env.DB_PORT || 5432,
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL Connected!"))
  .catch((err) => console.error("❌ Database Connection Error:", err));

module.exports = pool;
