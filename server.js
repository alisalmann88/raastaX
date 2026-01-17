const express = require("express");
const db = require("./db");
const path = require("path");

const app = express();

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static("public"));

// Simple health check
app.get("/health", (req, res) => {
  console.log("Health check called");
  res.json({ status: "OK", time: new Date().toISOString() });
});

// API routes
app.get("/api/trips", async (req, res) => {
  try {
    const [trips] = await db.query("SELECT * FROM trips");
    res.json(trips || []);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  console.log("Serving index.html for:", req.url);
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get port from Railway or default
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Server started at http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 PORT from env: ${process.env.PORT || 'Not set'}`);
  console.log(`🗺️ Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);
  console.log("=".repeat(50));
});
