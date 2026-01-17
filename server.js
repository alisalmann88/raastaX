const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();

// CORS for Railway
app.use(cors({
  origin: ['https://raastax-production.up.railway.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health endpoint (CRITICAL for Railway)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    service: "raastaX",
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Your existing API routes here...
app.get("/trips", async (req, res) => {
  try {
    const [trips] = await db.query("SELECT * FROM trips");
    res.json(trips || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// SPA catch-all
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Railway automatically provides PORT
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`
  ==========================================
  🚀 raastaX Server Started Successfully!
  ✅ Listening on: ${HOST}:${PORT}
  ✅ Public URL: https://raastax-production.up.railway.app
  ✅ Health Check: /health
  ✅ Environment: ${process.env.NODE_ENV || 'production'}
  ==========================================
  `);
});
