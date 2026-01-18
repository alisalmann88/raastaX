const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();

// ==================== MIDDLEWARE ====================
// Fix CORS to allow your frontend
app.use(cors({
  origin: [
    'https://raastax-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  console.log("✅ Health check called");
  res.json({
    status: "healthy",
    service: "raastaX",
    domain: "raastax-production.up.railway.app",
    port: 8080,
    timestamp: new Date().toISOString(),
    database: "connected"
  });
});

// ==================== API ROUTES ====================

// GET all trips
app.get("/api/trips", async (req, res) => {
  try {
    console.log("📊 Fetching trips...");
    const [trips] = await db.query("SELECT * FROM trips ORDER BY date ASC");
    
    // Format trips
    const formattedTrips = trips.map(trip => {
      let bookedSeats = [];
      if (trip.bookedSeats && trip.bookedSeats !== '[]') {
        try {
          bookedSeats = JSON.parse(trip.bookedSeats);
        } catch (e) {
          bookedSeats = [];
        }
      }
      
      return {
        id: trip.id,
        driverName: trip.driverName,
        carModel: trip.carModel,
        pickup: trip.pickup,
        destination: trip.destination,
        date: trip.date,
        seats: trip.seats,
        fare: trip.fare,
        bookedSeats: bookedSeats,
        availableSeats: trip.seats - bookedSeats.length
      };
    });
    
    res.json(formattedTrips);
  } catch (error) {
    console.error("❌ Error fetching trips:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch trips: " + error.message 
    });
  }
});

// POST add new trip - UPDATED FOR YOUR FORM
app.post("/api/trips", async (req, res) => {
  try {
    console.log("📝 Add trip request received:", req.body);
    
    const { carModel, pickup, destination, date, seats, fare } = req.body;
    
    // Since your form doesn't have driverName, use a default
    const driverName = "Driver"; // You can change this or add field later
    
    // Validation
    if (!carModel || !pickup || !destination || !date || !seats || !fare) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required" 
      });
    }
    
    console.log(`🚗 Adding trip: ${pickup} → ${destination} on ${date}`);
    
    const [result] = await db.query(
      "INSERT INTO trips (driverName, carModel, pickup, destination, date, seats, fare, bookedSeats) VALUES (?, ?, ?, ?, ?, ?, ?, '[]')",
      [driverName, carModel, pickup, destination, date, parseInt(seats), parseFloat(fare)]
    );
    
    console.log(`✅ Trip added successfully! ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: "Trip added successfully!",
      tripId: result.insertId,
      tripDetails: {
        driverName,
        carModel,
        pickup,
        destination,
        date,
        seats: parseInt(seats),
        fare: parseFloat(fare)
      }
    });
    
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Database error: " + error.message 
    });
  }
});

// POST book seats
app.post("/api/book", async (req, res) => {
  try {
    const { tripId, seats, passengerName } = req.body;
    
    if (!tripId || !seats || !Array.isArray(seats)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid booking data" 
      });
    }
    
    // Get current trip
    const [trips] = await db.query("SELECT * FROM trips WHERE id = ?", [tripId]);
    if (!trips.length) {
      return res.status(404).json({ 
        success: false,
        error: "Trip not found" 
      });
    }
    
    const trip = trips[0];
    let bookedSeats = [];
    
    // Parse existing booked seats
    if (trip.bookedSeats && trip.bookedSeats !== '[]') {
      try {
        bookedSeats = JSON.parse(trip.bookedSeats);
      } catch (e) {
        console.warn("Error parsing booked seats:", e);
      }
    }
    
    // Check for conflicts
    const conflictingSeats = seats.filter(seat => bookedSeats.includes(seat));
    if (conflictingSeats.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Seats already booked",
        conflictingSeats: conflictingSeats
      });
    }
    
    // Update booked seats
    bookedSeats = [...bookedSeats, ...seats];
    await db.query(
      "UPDATE trips SET bookedSeats = ? WHERE id = ?",
      [JSON.stringify(bookedSeats), tripId]
    );
    
    res.json({
      success: true,
      message: `Successfully booked ${seats.length} seat(s)`,
      bookingDetails: {
        tripId: tripId,
        seats: seats,
        totalFare: seats.length * trip.fare,
        passengerName: passengerName
      }
    });
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ 
      success: false,
      error: "Booking failed: " + error.message 
    });
  }
});

// ==================== TEST ROUTES ====================
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "raastaX API is working! 🚀",
    endpoints: [
      "GET  /api/trips - Get all trips",
      "POST /api/trips - Add new trip",
      "POST /api/book - Book seats",
      "GET  /health - Health check"
    ]
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [result] = await db.query("SELECT 1 as test");
    res.json({
      success: true,
      message: "Database connection successful"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed: " + error.message
    });
  }
});

// ==================== LOG ALL REQUESTS ====================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Request Body:', req.body);
  }
  next();
});

// ==================== SPA ROUTES ====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/driver", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/add-trip", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-trip.html"));
});

app.get("/my-trips", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "my-trips.html"));
});

// Catch-all for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ================================================
  🚀 raastaX Server Started!
  
  📍 Port: ${PORT}
  🌐 Domain: raastax-production.up.railway.app
  🏥 Health: /health
  📊 API: /api/trips
  
  🛠️  Add Trip Endpoint: POST /api/trips
  ✅ CORS configured for your frontend
  
  ================================================
  `);
});
