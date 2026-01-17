const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const fs = require("fs");

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    // Cache control for different file types
    const ext = path.extname(filePath);
    if (ext === ".html") {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    } else if (ext === ".css" || ext === ".js") {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }
  }
}));

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  console.log("✅ Health check called");
  res.status(200).json({
    status: "healthy",
    service: "raastaX",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8080,
    environment: process.env.NODE_ENV || "production"
  });
});

// ==================== API ROUTES ====================

// GET all trips
app.get("/api/trips", async (req, res) => {
  try {
    console.log("📊 Fetching trips...");
    const [trips] = await db.query("SELECT * FROM trips ORDER BY date ASC");
    
    // Format trips with proper date and booked seats
    const formattedTrips = trips.map(trip => {
      let bookedSeats = [];
      if (trip.bookedSeats && trip.bookedSeats !== '[]') {
        try {
          bookedSeats = JSON.parse(trip.bookedSeats);
        } catch (e) {
          console.warn("Error parsing booked seats:", e);
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
        createdAt: trip.created_at
      };
    });
    
    console.log(`✅ Returning ${formattedTrips.length} trips`);
    res.json(formattedTrips);
  } catch (error) {
    console.error("❌ Error fetching trips:", error);
    res.status(500).json({ 
      error: "Failed to fetch trips",
      message: error.message 
    });
  }
});

// POST add new trip
app.post("/api/trips", async (req, res) => {
  try {
    const { driverName, carModel, pickup, destination, date, seats, fare } = req.body;
    
    // Validation
    if (!driverName || !carModel || !pickup || !destination || !date || !seats || !fare) {
      return res.status(400).json({ 
        error: "All fields are required",
        required: ["driverName", "carModel", "pickup", "destination", "date", "seats", "fare"]
      });
    }
    
    console.log(`➕ Adding trip: ${pickup} → ${destination} by ${driverName}`);
    
    const [result] = await db.query(
      `INSERT INTO trips (driverName, carModel, pickup, destination, date, seats, fare, bookedSeats) 
       VALUES (?, ?, ?, ?, ?, ?, ?, '[]')`,
      [driverName, carModel, pickup, destination, date, parseInt(seats), parseFloat(fare)]
    );
    
    console.log(`✅ Trip added with ID: ${result.insertId}`);
    res.status(201).json({
      success: true,
      message: "Trip added successfully",
      tripId: result.insertId
    });
  } catch (error) {
    console.error("❌ Error adding trip:", error);
    res.status(500).json({ 
      error: "Failed to add trip",
      message: error.message 
    });
  }
});

// POST book seats
app.post("/api/book", async (req, res) => {
  try {
    const { tripId, seats, passengerName } = req.body;
    
    if (!tripId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ 
        error: "Invalid booking data",
        required: { tripId: "number", seats: "array", passengerName: "string" }
      });
    }
    
    console.log(`🎫 Booking seats ${seats.join(',')} on trip ${tripId}`);
    
    // Get current trip data
    const [trips] = await db.query("SELECT * FROM trips WHERE id = ?", [tripId]);
    if (!trips.length) {
      return res.status(404).json({ error: "Trip not found" });
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
    
    // Check for seat conflicts
    const conflictingSeats = seats.filter(seat => bookedSeats.includes(seat));
    if (conflictingSeats.length > 0) {
      return res.status(409).json({
        error: "Seats already booked",
        conflictingSeats: conflictingSeats,
        availableSeats: trip.seats - bookedSeats.length
      });
    }
    
    // Check if enough seats available
    if (bookedSeats.length + seats.length > trip.seats) {
      return res.status(400).json({
        error: "Not enough seats available",
        requested: seats.length,
        available: trip.seats - bookedSeats.length
      });
    }
    
    // Update booked seats
    bookedSeats = [...bookedSeats, ...seats];
    await db.query(
      "UPDATE trips SET bookedSeats = ? WHERE id = ?",
      [JSON.stringify(bookedSeats), tripId]
    );
    
    console.log(`✅ Successfully booked seats ${seats.join(',')}`);
    res.json({
      success: true,
      message: `Successfully booked ${seats.length} seat(s)`,
      tripId: tripId,
      bookedSeats: bookedSeats,
      availableSeats: trip.seats - bookedSeats.length,
      bookingDetails: {
        passengerName: passengerName,
        seats: seats,
        fare: seats.length * trip.fare,
        pickup: trip.pickup,
        destination: trip.destination,
        date: trip.date
      }
    });
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ 
      error: "Booking failed",
      message: error.message 
    });
  }
});

// ==================== TEST ROUTES ====================
app.get("/api/test", (req, res) => {
  res.json({
    message: "raastaX API is working! 🚀",
    endpoints: [
      "GET  /api/trips - Get all trips",
      "POST /api/trips - Add new trip",
      "POST /api/book - Book seats",
      "GET  /health - Health check"
    ],
    timestamp: new Date().toISOString()
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [result] = await db.query("SELECT 1 as test");
    res.json({
      success: true,
      message: "Database connection successful",
      test: result[0].test
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

// ==================== SPA ROUTES ====================
// Serve index.html for all SPA routes
const spaRoutes = [
  "/",
  "/search",
  "/driver",
  "/booking",
  "/my-trips",
  "/settings",
  "/payment",
  "/e-ticket"
];

spaRoutes.forEach(route => {
  app.get(route, (req, res) => {
    const indexPath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <html>
          <body style="padding: 40px; font-family: Arial;">
            <h1>raastaX is Running! 🚀</h1>
            <p>But index.html is missing.</p>
            <p>API Endpoints:</p>
            <ul>
              <li><a href="/health">/health</a> - Health check</li>
              <li><a href="/api/trips">/api/trips</a> - Get trips</li>
              <li><a href="/api/test">/api/test</a> - Test API</li>
            </ul>
          </body>
        </html>
      `);
    }
  });
});

// Catch-all for any other route (must be last)
app.get("*", (req, res) => {
  res.redirect("/");
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error("⚠️ Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`
  ================================================
  🚀 raastaX Server Started Successfully!
  
  📍 Port: ${PORT}
  🌐 Environment: ${process.env.NODE_ENV || "production"}
  🗺️ Public URL: https://raastax-production.up.railway.app
  
  ✅ Health Check: /health
  ✅ API Status: /api/test
  ✅ Database Test: /api/test-db
  
  📊 API Endpoints:
     GET  /api/trips    - List all trips
     POST /api/trips    - Add new trip
     POST /api/book     - Book seats
  
  ================================================
  `);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down...");
  process.exit(0);
});
