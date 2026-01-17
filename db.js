// db.js
const mysql = require("mysql2/promise");

// DATABASE_URL comes from Railway variables
// e.g., DATABASE_URL=mysql://root:password@host:3306/dbname
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pool = mysql.createPool(process.env.DATABASE_URL);

// Test connection at startup
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
