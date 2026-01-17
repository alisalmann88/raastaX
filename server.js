const express = require("express");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health endpoint (Railway checks this)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// API endpoints placeholder
app.get("/api/trips", (req, res) => {
  res.json([{ message: "Trips endpoint" }]);
});

// All other routes serve index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Railway provides PORT, use 3000 as fallback
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Access URL: https://raastax-production.up.railway.app`);
});
