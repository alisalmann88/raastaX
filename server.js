const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();

// CORS setup
app.use(cors());

// JSON parsing
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint (CRITICAL for Railway)
app.get("/health", (req, res) => {
  console.log("Health check called");
  res.status(200).json({ 
    status: "OK",
    service: "raastaX",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get("/api/trips", async (req, res) => {
  try {
    console.log("Fetching trips...");
    const [trips] = await db.query("SELECT * FROM trips");
    res.json(trips || []);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/trips", async (req, res) => {
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

// Serve index.html for all other routes (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ========================================
  🚀 raastaX Server Started!
  Port: ${PORT}
  Health: /health
  API: /api/trips
  ========================================
  `);
});
