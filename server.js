const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const db = require("./db");
const path = require("path");

const app = express();

// ==================== SECURITY & MIDDLEWARE ==================== //

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configuration for Railway
app.use(cors({
  origin: [
    'https://raastax-production.up.railway.app',
    'https://raastax.railway.app',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true
}));

app.use(express.json());

// ==================== STATIC FILES ==================== //
app.use(express.static(path.join(__dirname, "public")));

// ==================== HEALTH CHECK ==================== //
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    service: "raastaX",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// ==================== API ROUTES ==================== //

// Get all trips
app.get("/trips", async (req, res) => {
  try {
    console.log("📦 Fetching trips from database...");
    const [trips] = await db.query("SELECT * FROM trips ORDER BY date ASC");
    
    if (!trips) {
      return res.json([]);
    }
    
    const formatted = trips.map(t => {
      let bookedSeats = [];
      if (t.bookedSeats && t.bookedSeats !== '[]') {
        try { 
          bookedSeats = JSON.parse(t.bookedSeats); 
        } catch (e) {
          console.warn("⚠️ Error parsing bookedSeats:", e);
          bookedSeats = [];
        }
      }

      const tripDate = new Date(t.date);
      tripDate.setMinutes(tripDate.getMinutes() + 5 * 60); // Pakistan UTC+5
      const dateString = tripDate.toISOString().split("T")[0];

      return { 
        ...t, 
        bookedSeats,
        date: dateString,
        availableSeats: t.seats - bookedSeats.length
      };
    });
    
    console.log(`✅ Returning ${formatted.length} trips`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Database fetch error:", err);
    res.status(500).json({ 
      message: "Failed to fetch trips from database",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Add a trip
app.post("/trips", async (req, res) => {
  const { driverName, carModel, pickup, destination, date, seats, fare } = req.body;
  
  if (!driverName || !carModel || !pickup || !destination || !date || !seats || !fare) {
    return res.status(400).json({ 
      message: "All fields are required",
      required: ["driverName", "carModel", "pickup", "destination", "date", "seats", "fare"]
    });
  }

  try {
    console.log("➕ Adding new trip:", { driverName, pickup, destination, date });
    
    const [result] = await db.query(
      `INSERT INTO trips (driverName, carModel, pickup, destination, date, seats, fare, bookedSeats)
       VALUES (?, ?, ?, ?, ?, ?, ?, '[]')`,
      [driverName, carModel, pickup, destination, date, seats, parseFloat(fare)]
    );
    
    console.log(`✅ Trip added with ID: ${result.insertId}`);
    res.status(201).json({ 
      message: "Trip added successfully", 
      tripId: result.insertId 
    });
  } catch (err) {
    console.error("❌ Database insert error:", err);
    res.status(500).json({ 
      message: "Failed to add trip to database",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Book seats
app.post("/book", async (req, res) => {
  const { tripId, seats, passengers } = req.body;
  
  if (!tripId || !seats || !Array.isArray(seats) || !passengers) {
    return res.status(400).json({ 
      message: "Missing or invalid fields",
      required: { tripId: "number", seats: "array", passengers: "array" }
    });
  }

  try {
    console.log(`🎫 Booking seats ${seats.join(',')} on trip ${tripId}`);
    
    const [rows] = await db.query("SELECT * FROM trips WHERE id = ?", [tripId]);
    
    if (!rows.length) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const trip = rows[0];
    let bookedSeats = [];
    
    if (trip.bookedSeats && trip.bookedSeats !== '[]') {
      try { 
        bookedSeats = JSON.parse(trip.bookedSeats); 
      } catch (e) {
        console.warn("⚠️ Error parsing bookedSeats:", e);
        bookedSeats = [];
      }
    }

    // Check for seat conflicts
    const alreadyBooked = seats.filter(s => bookedSeats.includes(s));
    if (alreadyBooked.length > 0) {
      return res.status(409).json({ 
        message: `Seat(s) ${alreadyBooked.join(', ')} already booked`,
        bookedSeats: alreadyBooked
      });
    }

    // Add new seats
    bookedSeats.push(...seats);
    
    await db.query(
      "UPDATE trips SET bookedSeats = ? WHERE id = ?", 
      [JSON.stringify(bookedSeats), tripId]
    );

    console.log(`✅ Seats ${seats.join(',')} booked successfully on trip ${tripId}`);
    res.json({ 
      success: true, 
      bookedSeats,
      message: `Successfully booked ${seats.length} seat(s)`,
      tripDetails: {
        driverName: trip.driverName,
        pickup: trip.pickup,
        destination: trip.destination,
        date: trip.date
      }
    });
    
  } catch (err) {
    console.error("❌ Booking error:", err);
    res.status(500).json({ 
      message: "Booking failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [result] = await db.query("SELECT 1 as test");
    res.json({ 
      success: true, 
      message: "Database connection successful",
      test: result 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Database connection failed",
      error: err.message 
    });
  }
});

// ==================== CATCH-ALL FOR SPA ==================== //
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==================== START SERVER ==================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 raastaX Server Started!
  🌐 Port: ${PORT}
  📍 Environment: ${process.env.NODE_ENV || 'production'}
  🗺️ Public URL: https://raastax-production.up.railway.app
  🏥 Health Check: https://raastax-production.up.railway.app/health
  📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Checking...'}
  `);
});
