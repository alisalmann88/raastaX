const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();

// ==================== MIDDLEWARE ==================== //
app.use(cors());
app.use(express.json());

// ==================== STATIC FILES ==================== //
app.use(express.static(path.join(__dirname, "public")));

// ==================== HEALTH CHECK (CRITICAL) ==================== //
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "raastaX is running",
    timestamp: new Date().toISOString()
  });
});

// ==================== API ROUTES ==================== //
app.get("/trips", async (req, res) => {
  try {
    const [trips] = await db.query("SELECT * FROM trips");
    res.json(trips || []);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/trips", async (req, res) => {
  try {
    const { driverName, carModel, pickup, destination, date, seats, fare } = req.body;
    const [result] = await db.query(
      `INSERT INTO trips (driverName, carModel, pickup, destination, date, seats, fare, bookedSeats)
       VALUES (?, ?, ?, ?, ?, ?, ?, '[]')`,
      [driverName, carModel, pickup, destination, date, seats, fare]
    );
    res.json({ message: "Trip added", tripId: result.insertId });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ message: "Server error" });
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
    
    res.json({ success: true });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== SPA CATCH-ALL ==================== //
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==================== START SERVER ==================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ raastaX server listening on port ${PORT}`);
});
