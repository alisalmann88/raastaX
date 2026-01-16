const mysql = require("mysql2/promise");

// Railway environment variables
const db = mysql.createPool({
  host: process.env.MYSQLHOST,       // e.g., mysql.railway.internal
  user: process.env.MYSQLUSER,       // e.g., root
  password: process.env.MYSQLPASSWORD, // e.g., KkSkJZxAYLFXuWDBxbmolMaRmJQFYcRk
  database: process.env.MYSQLDATABASE, // e.g., railway
  port: process.env.MYSQLPORT        // e.g., 3306
});

// Optional test connection
db.getConnection()
  .then(() => console.log("✅ Connected to Railway MySQL"))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = db;
