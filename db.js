const mysql = require("mysql2/promise");

console.log("🔧 Initializing database connection...");

// Use Railway's DATABASE_URL or build from individual variables
let connectionString;

if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL;
  console.log("📊 Using DATABASE_URL from environment");
} else if (process.env.MYSQL_URL) {
  connectionString = process.env.MYSQL_URL;
  console.log("📊 Using MYSQL_URL from environment");
} else if (process.env.MYSQLHOST) {
  // Build from individual Railway MySQL variables
  connectionString = `mysql://${process.env.MYSQLUSER || 'root'}:${process.env.MYSQLPASSWORD}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT || 3306}/${process.env.MYSQLDATABASE || 'railway'}`;
  console.log("📊 Built connection from individual variables");
} else {
  console.error("❌ No database configuration found!");
  // Don't exit - run without database
  console.log("⚠️ Running without database connection");
}

let pool;

if (connectionString) {
  pool = mysql.createPool({
    uri: connectionString,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Test connection
  (async () => {
    try {
      const conn = await pool.getConnection();
      console.log("✅ Database connected successfully!");
      console.log(`📍 Host: ${conn.config.host}`);
      console.log(`🗃️ Database: ${conn.config.database}`);
      conn.release();
    } catch (err) {
      console.error("❌ Database connection error:", err.message);
      console.log("⚠️ Running without database - API will return mock data");
    }
  })();
} else {
  console.log("⚠️ No database connection - running in mock mode");
  
  // Mock database methods
  pool = {
    query: async () => {
      console.log("📦 Mock database query");
      return [[]]; // Return empty result
    },
    getConnection: async () => {
      return {
        query: async () => [[]],
        release: () => {}
      };
    }
  };
}

module.exports = pool;
