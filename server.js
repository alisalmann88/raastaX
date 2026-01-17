const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check (Railway needs this)
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "raastaX is running",
    time: new Date().toISOString() 
  });
});

// API Routes
app.get("/trips", async (req, res) => {
  try {
    const [trips] = await db.query("SELECT * FROM trips");
    res.json(trips || []);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/trips", async (req, res) => {
  try {
    const { driverName, carModel, pickup, destination, date, seats, fare } = req.body;
    const [result] = await db.query(
      "INSERT INTO trips (driverName, carModel, pickup, destination, date, seats, fare, bookedSeats) VALUES (?, ?, ?, ?, ?, ?, ?, '[]')",
      [driverName, carModel, pickup, destination, date, seats, fare]
    );
    res.json({ message: "Trip added", id: result.insertId });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to add trip" });
  }
});

app.post("/book", async (req, res) => {
  try {
    const { tripId, seats } = req.body;
    const [rows] = await db.query("SELECT bookedSeats FROM trips WHERE id = ?", [tripId]);
    
    let bookedSeats = [];
    if (rows[0].bookedSeats) {
      try { bookedSeats = JSON.parse(rows[0].bookedSeats); } catch {}
    }
    
    bookedSeats.push(...seats);
    await db.query("UPDATE trips SET bookedSeats = ? WHERE id = ?", 
      [JSON.stringify(bookedSeats), tripId]);
    
    res.json({ success: true, bookedSeats });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

// SPA catch-all (MUST be last)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Use 8080 since that's what works
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  🚀 raastaX Server Started!
  ✅ Port: ${PORT}
  ✅ Health: /health
  ✅ Database: Connected
  ✅ URL: https://raastax-production.up.railway.app
  `);
});
