// db.js
const mysql = require("mysql2/promise"); // make sure mysql2 is installed

const pool = mysql.createPool({
  host: "localhost",     // your MySQL host
  user: "root",          // your MySQL username
  password: ";5LZmgC3+zu*5K", // your MySQL password
  database: "raastax_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;


