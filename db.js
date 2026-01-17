// db.js
const mysql = require("mysql2/promise");

// Use the full DATABASE_URL from Railway
const pool = mysql.createPool(process.env.DATABASE_URL);

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB connected");
    conn.release();
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }
})();

module.exports = pool;
