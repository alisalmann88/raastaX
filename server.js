const express = require("express");
const path = require("path");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Test route
app.get("/ping", (req, res) => res.send("pong"));

// Root route
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
