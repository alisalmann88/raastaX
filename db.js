const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.MYSQLHOST,       // Railway host, e.g., mysql.railway.internal
  user: process.env.MYSQLUSER,       // Railway user, usually 'root'
  password: process.env.MYSQLPASSWORD, 
  database: process.env.MYSQLDATABASE, 
  port: process.env.MYSQLPORT        // 3306
});

// Optional: test connection
db.getConnection()
  .then(() => console.log("✅ Connected to Railway MySQL"))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = db;
