// db.js - Updated with better debugging
const mysql = require("mysql2/promise");

console.log("🔧 Checking DATABASE_URL...");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  console.log("Available environment variables:", Object.keys(process.env));
  // Try alternative MySQL variables
}

// Try multiple connection string options
const connectionString = process.env.DATABASE_URL || 
  `mysql://${process.env.MYSQLUSER}:${process.env.MYSQLPASSWORD}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT}/${process.env.MYSQLDATABASE}`;

console.log("Connection string:", connectionString ? "Present" : "Missing");

const pool = mysql.createPool(connectionString);

// Test connection with better logging
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB connected successfully!");
    console.log("Host:", conn.config.host);
    console.log("Database:", conn.config.database);
    
    // Test query
    const [rows] = await conn.query("SHOW TABLES");
    console.log("Tables in database:", rows.map(r => Object.values(r)[0]));
    
    conn.release();
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    console.error("Error code:", err.code);
    console.error("Error SQL State:", err.sqlState);
  }
})();

module.exports = pool;
