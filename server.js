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
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    if (ext === ".css") {
      res.setHeader("Content-Type", "text/css");
    } else if (ext === ".js") {
      res.setHeader("Content-Type", "application/javascript");
    }
  }
}));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.body) {
    console.log('Request Body:', req.body);
  }
  next();
});

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  res.json({ status: "OK", static: "serving" });
});

// ==================== API ROUTES ====================

// GET all trips
app.get("/api/trips", async (req, res) => {
  try {
    console.log("📊 GET /api/trips");
    const [trips] = await db.query("SELECT * FROM trips ORDER BY date ASC");
    
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
    console.error("❌ GET trips error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch trips" 
    });
  }
});

// POST add new trip
app.post("/api/trips", async (req, res) => {
  try {
    console.log("📝 POST /api/trips - Request body:", req.body);
    
    const { driverName, carModel, pickup, destination, date, seats, fare } = req.body;
    
    // Validation
    if (!driverName || !carModel || !pickup || !destination || !date || !seats || !fare) {
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
    
    console.log(`✅ Trip added! ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: "Trip added successfully!",
      tripId: result.insertId
    });
    
  } catch (error) {
    console.error("❌ POST trips error:", error);
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
    
    const [trips] = await db.query("SELECT * FROM trips WHERE id = ?", [tripId]);
    if (!trips.length) {
      return res.status(404).json({ 
        success: false,
        error: "Trip not found" 
      });
    }
    
    const trip = trips[0];
    let bookedSeats = [];
    
    if (trip.bookedSeats && trip.bookedSeats !== '[]') {
      try {
        bookedSeats = JSON.parse(trip.bookedSeats);
      } catch (e) {
        console.warn("Error parsing booked seats:", e);
      }
    }
    
    const conflictingSeats = seats.filter(seat => bookedSeats.includes(seat));
    if (conflictingSeats.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Seats already booked",
        conflictingSeats: conflictingSeats
      });
    }
    
    bookedSeats = [...bookedSeats, ...seats];
    await db.query(
      "UPDATE trips SET bookedSeats = ? WHERE id = ?",
      [JSON.stringify(bookedSeats), tripId]
    );
    
    res.json({
      success: true,
      message: `Successfully booked ${seats.length} seat(s)`
    });
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ 
      success: false,
      error: "Booking failed" 
    });
  }
});

// GET driver's trips - NEW ENDPOINT
app.get("/api/driver/trips", async (req, res) => {
  try {
    const { driverName } = req.query;
    
    if (!driverName) {
      return res.status(400).json({ 
        success: false,
        error: "Driver name required" 
      });
    }
    
    console.log(`📊 GET /api/driver/trips for driver: ${driverName}`);
    
    const [trips] = await db.query(
      "SELECT * FROM trips WHERE driverName = ? ORDER BY date DESC",
      [driverName]
    );
    
    // Format trips with booked seats
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
        availableSeats: trip.seats - bookedSeats.length,
        earnings: trip.fare * bookedSeats.length
      };
    });
    
    console.log(`✅ Found ${formattedTrips.length} trips for driver ${driverName}`);
    
    res.json({
      success: true,
      trips: formattedTrips,
      totalTrips: formattedTrips.length,
      totalEarnings: formattedTrips.reduce((sum, trip) => sum + trip.earnings, 0)
    });
    
  } catch (error) {
    console.error("❌ Error fetching driver trips:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch driver trips" 
    });
  }
});

// Test API
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "raastaX API is working! 🚀",
    endpoints: [
      "GET  /api/trips - List all trips",
      "POST /api/trips - Add new trip",
      "POST /api/book - Book seats",
      "GET  /api/driver/trips - Get driver's trips",
      "GET  /health - Health check"
    ]
  });
});

// Test database
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
      message: "Database connection failed"
    });
  }
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

app.get("/my-trips", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "my-trips.html"));
});

app.get("/bookings", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bookings.html"));
});

app.get("/earnings", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "earnings.html"));
});

app.get("/seat-allocation", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "seat-allocation.html"));
});

app.get("/payment", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "payment.html"));
});

app.get("/e-ticket", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "e-ticket.html"));
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
  📁 Static files: /public
  🏥 Health: /health
  
  ✅ API Endpoints Ready:
     GET  /api/trips         - List all trips
     POST /api/trips         - Add new trip
     POST /api/book          - Book seats
     GET  /api/driver/trips  - Get driver's trips
     GET  /api/test          - Test API
  
  ================================================
  `);
});
