const express = require("express");
const cors = require("cors");
const db = require("./db"); // your mysql2 promise pool
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ===== Home =====
app.get("/", (req, res) => {
  res.send("RaastaX server running");
});

// ===== Get all trips =====
app.get("/trips", async (req, res) => {
  try {
    const [trips] = await db.query("SELECT * FROM trips");

    const formattedTrips = trips.map(t => {
      let bookedSeatsArr = [];
      if (t.bookedSeats) {
        try {
          bookedSeatsArr = JSON.parse(t.bookedSeats);
        } catch {
          bookedSeatsArr = [];
        }
      }

      // Convert MySQL DATETIME to Pakistan local date string (YYYY-MM-DD)
      const tripDate = new Date(t.date);
      const offset = 5 * 60; // Pakistan UTC+5 in minutes
      tripDate.setMinutes(tripDate.getMinutes() + offset);

      const dateString = tripDate.toISOString().split("T")[0]; // "YYYY-MM-DD"

      return {
        id: t.id,
        driverName: t.driverName,
        carModel: t.carModel,
        pickup: t.pickup,
        destination: t.destination,
        date: dateString,
        seats: t.seats,
        fare: t.fare,
        bookedSeats: bookedSeatsArr
      };
    });

    res.json(formattedTrips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ===== Add a trip =====
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

    res.status(201).json({ message: "Trip added successfully", tripId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ===== Book seats =====
app.post("/book", async (req, res) => {
  const { tripId, seats, passengers } = req.body;

  if (!tripId || !seats || !passengers) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Get current bookedSeats from DB
    const [rows] = await db.query("SELECT bookedSeats FROM trips WHERE id = ?", [tripId]);
    if (!rows.length) return res.status(404).json({ message: "Trip not found" });

    let bookedSeatsArr = [];
    if (rows[0].bookedSeats) {
      try { bookedSeatsArr = JSON.parse(rows[0].bookedSeats); } catch { bookedSeatsArr = []; }
    }

    // Check if any seat is already booked
    for (let s of seats) {
      if (bookedSeatsArr.includes(s)) {
        return res.status(400).json({ message: `Seat ${s} already booked` });
      }
    }

    // Add new seats
    bookedSeatsArr.push(...seats);

    // Update DB
    await db.query("UPDATE trips SET bookedSeats = ? WHERE id = ?", [JSON.stringify(bookedSeatsArr), tripId]);

    // ✅ Return JSON
    res.json({ success: true, message: "Seats booked successfully!", bookedSeats: bookedSeatsArr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ===== Start server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
