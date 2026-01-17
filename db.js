const mysql = require("mysql2/promise");

console.log("🔧 Initializing database connection...");

// Try multiple connection string sources for Railway
let connectionString;

if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL;
  console.log("📊 Using DATABASE_URL from environment");
} else if (process.env.MYSQL_URL) {
  connectionString = process.env.MYSQL_URL;
  console.log("📊 Using MYSQL_URL from environment");
} else if (process.env.MYSQLHOST) {
  // Build connection string from individual variables
  connectionString = `mysql://${process.env.MYSQLUSER || 'root'}:${process.env.MYSQLPASSWORD}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT || 3306}/${process.env.MYSQLDATABASE || 'railway'}`;
  console.log("📊 Built connection string from individual variables");
} else {
  console.error("❌ No database connection configuration found!");
  console.log("Available environment variables:", Object.keys(process.env).filter(key => key.includes('MYSQL') || key.includes('DATABASE')));
  process.exit(1);
}

// Create connection pool with retry logic
const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
(async () => {
  let retries = 5;
  let connected = false;
  
  while (retries > 0 && !connected) {
    try {
      const conn = await pool.getConnection();
      console.log("✅ Database connected successfully!");
      console.log(`📍 Host: ${conn.config.host}`);
      console.log(`🗃️ Database: ${conn.config.database}`);
      
      // Test query
      const [tables] = await conn.query("SHOW TABLES");
      console.log(`📋 Found ${tables.length} table(s)`);
      
      conn.release();
      connected = true;
    } catch (err) {
      console.warn(`⚠️ Connection attempt failed (${retries} retries left):`, err.message);
      retries--;
      
      if (retries > 0) {
        console.log("🔄 Retrying in 3 seconds...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error("❌ Max retries reached. Could not connect to database.");
        console.error("Connection error details:", err);
      }
    }
  }
})();

module.exports = pool;
