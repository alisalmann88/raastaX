const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const fs = require("fs");

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== STATIC FILES ====================
// Serve ALL static files with proper MIME types
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    // Set correct content types
    const ext = path.extname(filePath);
    if (ext === ".css") {
      res.setHeader("Content-Type", "text/css");
    } else if (ext === ".js") {
      res.setHeader("Content-Type", "application/javascript");
    } else if (ext === ".html") {
      res.setHeader("Content-Type", "text/html");
    }
    
    // Cache control
    if (ext === ".css" || ext === ".js") {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }
  }
}));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  res.json({ status: "OK", static: "serving" });
});

// ==================== TEST STATIC FILES ====================
app.get("/test-css", (req, res) => {
  const cssPath = path.join(__dirname, "public", "index.css");
  if (fs.existsSync(cssPath)) {
    res.sendFile(cssPath);
  } else {
    res.json({ error: "CSS file not found", path: cssPath });
  }
});

app.get("/test-js", (req, res) => {
  const jsPath = path.join(__dirname, "public", "index.js");
  if (fs.existsSync(jsPath)) {
    res.sendFile(jsPath);
  } else {
    res.json({ error: "JS file not found", path: jsPath });
  }
});

// ==================== API ROUTES (keep your existing) ====================

// ==================== SPA ROUTES ====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "search.html"));
});

app.get("/driver", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "driver.html"));
});

app.get("/add-trip", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-trip.html"));
});

// Catch-all for SPA
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "public", req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ================================================
  🚀 raastaX Server Started!
  
  📍 Port: ${PORT}
  🌐 Domain: raastax-production.up.railway.app
  📁 Static files: /public
  🏥 Health: /health
  📊 Test CSS: /test-css
  📊 Test JS: /test-js
  
  ================================================
  `);
});
