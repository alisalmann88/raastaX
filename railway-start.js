// railway-start.js - Simple test server
const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("*", (req, res) => {
  res.send("raastaX is running!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Railway server on port ${PORT}`);
});
