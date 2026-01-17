// server.js
const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ===== API =====

// Get all trips
app.get("/trips", async (req, res) => {
  try {
    const [trips] = await db.query("SELECT * FROM trips");
    const formatted = trips.map(t => {
      let bookedSeats = [];
      if (t.bookedSeats) {
        try { bookedSeats = JSON.parse(t.bookedSeats); } catch {}
      }

      const tripDate = new Date(t.date);
      tripDate.setMinutes(tripDate.getMinutes() + 5 * 60); // Pakistan UTC+5
      const dateString = tripDate.toISOString().split("T")[0];

      return { ...t, bookedSeats, date: dateString };
    });
    res.json(formatted);
  } catch (err) {
    console.error("DB fetch error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// Add a trip
app.post("/trips", async (req, res) => {
  const { driverName, carModel, pickup, destination, date, seats, fare } = req.body;
  if (!driverName || !carModel || !pickup || !destination || !date || !seats || !fare) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO trips (driverName, carModel, pickup, destination, date, seats, fare, bookedSeats)
       VALUES (?, ?, ?, ?, ?, ?, ?, '[]')`,
      [driverName, carModel, pickup, destination, date, seats, fare]
    );
    res.status(201).json({ message: "Trip added", tripId: result.insertId });
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// Book seats
app.post("/book", async (req, res) => {
  const { tripId, seats, passengers } = req.body;
  if (!tripId || !seats || !passengers) return res.status(400).json({ message: "Missing fields" });

  try {
    const [rows] = await db.query("SELECT bookedSeats FROM trips WHERE id = ?", [tripId]);
    if (!rows.length) return res.status(404).json({ message: "Trip not found" });

    let bookedSeats = [];
    if (rows[0].bookedSeats) {
      try { bookedSeats = JSON.parse(rows[0].bookedSeats); } catch {}
    }

    for (let s of seats) if (bookedSeats.includes(s)) return res.status(400).json({ message: `Seat ${s} booked` });

    bookedSeats.push(...seats);
    await db.query("UPDATE trips SET bookedSeats = ? WHERE id = ?", [JSON.stringify(bookedSeats), tripId]);

    res.json({ success: true, bookedSeats });
  } catch (err) {
    console.error("DB update error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ===== Start server =====
const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT not defined by Railway");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
