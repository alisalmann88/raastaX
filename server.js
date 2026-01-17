const express = require("express");
const path = require("path");

const app = express();

// Serve static files
app.use(express.static("public"));

// HEALTH CHECK - This is CRITICAL for Railway
app.get("/health", (req, res) => {
  console.log("✅ Health check passed");
  res.status(200).send("OK");
});

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// All other routes
app.get("*", (req, res) => {
  res.redirect("/");
});

// Railway provides PORT automatically
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health: http://0.0.0.0:${PORT}/health`);
});
