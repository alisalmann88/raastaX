const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const db = require("./db");
const path = require("path");
const fs = require("fs");

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(helmet());
app.use(xss());
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", apiLimiter);

const JWT_SECRET = process.env.JWT_SECRET || "raastax-dev-secret";

const signToken = (user) => jwt.sign(
  { id: user.id, role: user.role, email: user.email },
  JWT_SECRET,
  { expiresIn: "7d" }
);

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing token" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  return next();
};

const ensureSchema = async () => {
  const [dbNameRows] = await db.query("SELECT DATABASE() AS name");
  const dbName = dbNameRows[0]?.name;
  if (!dbName) {
    console.warn("⚠️ No database selected - skipping schema setup");
    return;
  }

  const hasColumn = async (table, column) => {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?",
      [dbName, table, column]
    );
    return rows[0]?.count > 0;
  };

  const addColumnIfMissing = async (table, column, definition) => {
    const exists = await hasColumn(table, column);
    if (!exists) {
      await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      password_hash VARCHAR(255),
      role ENUM('passenger', 'driver', 'admin') DEFAULT 'passenger',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS trips (
      id INT PRIMARY KEY AUTO_INCREMENT,
      trip_code VARCHAR(20) UNIQUE,
      user_id INT,
      driver_id INT,
      driverName VARCHAR(100),
      carModel VARCHAR(100),
      pickup_location VARCHAR(100),
      pickup VARCHAR(100),
      destination VARCHAR(100),
      departure_time DATETIME,
      date DATETIME,
      passengers INT DEFAULT 1,
      seats INT DEFAULT 1,
      fare DECIMAL(10,2) DEFAULT 0,
      status ENUM('pending', 'confirmed', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending',
      bookedSeats TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing("trips", "trip_code", "VARCHAR(20) UNIQUE");
  await addColumnIfMissing("trips", "user_id", "INT");
  await addColumnIfMissing("trips", "driver_id", "INT");
  await addColumnIfMissing("trips", "driverName", "VARCHAR(100)");
  await addColumnIfMissing("trips", "carModel", "VARCHAR(100)");
  await addColumnIfMissing("trips", "pickup_location", "VARCHAR(100)");
  await addColumnIfMissing("trips", "pickup", "VARCHAR(100)");
  await addColumnIfMissing("trips", "destination", "VARCHAR(100)");
  await addColumnIfMissing("trips", "departure_time", "DATETIME");
  await addColumnIfMissing("trips", "date", "DATETIME");
  await addColumnIfMissing("trips", "passengers", "INT DEFAULT 1");
  await addColumnIfMissing("trips", "seats", "INT DEFAULT 1");
  await addColumnIfMissing("trips", "fare", "DECIMAL(10,2) DEFAULT 0");
  await addColumnIfMissing("trips", "status", "ENUM('pending', 'confirmed', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending'");
  await addColumnIfMissing("trips", "bookedSeats", "TEXT");
  await addColumnIfMissing("trips", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

  await db.query(`
    CREATE TABLE IF NOT EXISTS live_tracking (
      id INT PRIMARY KEY AUTO_INCREMENT,
      trip_id INT,
      lat DECIMAL(10,8),
      lng DECIMAL(11,8),
      is_estimated BOOLEAN DEFAULT FALSE,
      signal_status ENUM('good', 'weak', 'lost') DEFAULT 'good',
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      trip_id INT,
      amount DECIMAL(10,2),
      provider VARCHAR(50),
      status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
      reference VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

ensureSchema().catch((error) => {
  console.error("❌ Schema setup failed:", error.message);
});

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
app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userRole = role && ["passenger", "driver", "admin"].includes(role) ? role : "passenger";

    const [result] = await db.query(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone || null, passwordHash, userRole]
    );

    const user = { id: result.insertId, email, role: userRole };
    return res.status(201).json({
      success: true,
      token: signToken(user),
      user
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.status(500).json({ success: false, error: "Signup failed" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const [users] = await db.query("SELECT id, email, password_hash, role FROM users WHERE email = ?", [email]);
    if (!users.length) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    return res.json({
      success: true,
      token: signToken(user),
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

app.post("/api/trips/search", async (req, res) => {
  try {
    const { pickup, destination, date } = req.body;
    if (!pickup || !destination) {
      return res.status(400).json({ success: false, error: "Pickup and destination are required" });
    }

    const query = `
      SELECT
        id,
        trip_code,
        driverName,
        carModel,
        COALESCE(pickup_location, pickup) AS pickup,
        destination,
        COALESCE(departure_time, date) AS departure_time,
        COALESCE(passengers, seats) AS passengers,
        fare,
        status,
        bookedSeats
      FROM trips
      WHERE COALESCE(pickup_location, pickup) = ?
        AND destination = ?
        ${date ? "AND DATE(COALESCE(departure_time, date)) = DATE(?)" : ""}
      ORDER BY COALESCE(departure_time, date) ASC
    `;

    const params = date ? [pickup, destination, date] : [pickup, destination];
    const [trips] = await db.query(query, params);
    const formattedTrips = trips.map((trip) => {
      let bookedSeats = [];
      if (trip.bookedSeats && trip.bookedSeats !== "[]") {
        try {
          bookedSeats = JSON.parse(trip.bookedSeats);
        } catch (error) {
          bookedSeats = [];
        }
      }
      const totalSeats = trip.passengers || 0;
      return {
        id: trip.id,
        tripCode: trip.trip_code,
        driverName: trip.driverName,
        carModel: trip.carModel,
        pickup: trip.pickup,
        destination: trip.destination,
        departureTime: trip.departure_time,
        passengers: totalSeats,
        fare: trip.fare,
        status: trip.status,
        availableSeats: Math.max(totalSeats - bookedSeats.length, 0)
      };
    });

    return res.json({ success: true, trips: formattedTrips });
  } catch (error) {
    console.error("❌ Trip search error:", error);
    return res.status(500).json({ success: false, error: "Trip search failed" });
  }
});

app.post("/api/trips/book", authenticate, async (req, res) => {
  try {
    const { tripId, seats } = req.body;
    if (!tripId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, error: "Trip ID and seats are required" });
    }

    const [trips] = await db.query("SELECT bookedSeats, COALESCE(passengers, seats) AS totalSeats FROM trips WHERE id = ?", [tripId]);
    if (!trips.length) {
      return res.status(404).json({ success: false, error: "Trip not found" });
    }

    let bookedSeats = [];
    if (trips[0].bookedSeats && trips[0].bookedSeats !== "[]") {
      try {
        bookedSeats = JSON.parse(trips[0].bookedSeats);
      } catch (error) {
        bookedSeats = [];
      }
    }

    const conflictingSeats = seats.filter((seat) => bookedSeats.includes(seat));
    if (conflictingSeats.length) {
      return res.status(409).json({ success: false, error: "Seats already booked", conflictingSeats });
    }

    const totalSeats = trips[0].totalSeats || 0;
    if (bookedSeats.length + seats.length > totalSeats) {
      return res.status(400).json({ success: false, error: "Not enough seats available" });
    }

    const updatedSeats = [...bookedSeats, ...seats];
    await db.query("UPDATE trips SET bookedSeats = ?, user_id = ? WHERE id = ?", [
      JSON.stringify(updatedSeats),
      req.user.id,
      tripId
    ]);

    return res.json({ success: true, message: "Booking confirmed", seats: updatedSeats.length });
  } catch (error) {
    console.error("❌ Booking error:", error);
    return res.status(500).json({ success: false, error: "Booking failed" });
  }
});

app.post("/api/payment/initiate", authenticate, async (req, res) => {
  try {
    const { tripId, amount, provider } = req.body;
    if (!tripId || !amount) {
      return res.status(400).json({ success: false, error: "Trip ID and amount are required" });
    }

    const reference = crypto.randomBytes(6).toString("hex");
    await db.query(
      "INSERT INTO payments (trip_id, amount, provider, status, reference) VALUES (?, ?, ?, 'pending', ?)",
      [tripId, amount, provider || "manual", reference]
    );

    return res.json({
      success: true,
      payment: {
        reference,
        provider: provider || "manual",
        status: "pending",
        amount
      },
      message: "Payment initiation recorded. Integrate your gateway here."
    });
  } catch (error) {
    console.error("❌ Payment initiation error:", error);
    return res.status(500).json({ success: false, error: "Payment initiation failed" });
  }
});

app.post("/api/driver/location", authenticate, requireRole("driver"), async (req, res) => {
  try {
    const { tripId, lat, lng, isEstimated, signalStatus } = req.body;
    if (!tripId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: "Trip ID, lat, and lng are required" });
    }

    await db.query(
      "INSERT INTO live_tracking (trip_id, lat, lng, is_estimated, signal_status) VALUES (?, ?, ?, ?, ?)",
      [tripId, lat, lng, Boolean(isEstimated), signalStatus || "good"]
    );

    return res.json({ success: true, message: "Location updated" });
  } catch (error) {
    console.error("❌ Driver location error:", error);
    return res.status(500).json({ success: false, error: "Failed to update location" });
  }
});

app.get("/api/track/:tripCode", async (req, res) => {
  try {
    const { tripCode } = req.params;
    let [trips] = await db.query("SELECT id, trip_code, status FROM trips WHERE trip_code = ?", [tripCode]);
    if (!trips.length && /^\d+$/.test(tripCode)) {
      [trips] = await db.query("SELECT id, trip_code, status FROM trips WHERE id = ?", [Number(tripCode)]);
    }
    if (!trips.length) {
      return res.status(404).json({ success: false, error: "Trip not found" });
    }

    const trip = trips[0];
    const [locations] = await db.query(
      "SELECT lat, lng, is_estimated, signal_status, recorded_at FROM live_tracking WHERE trip_id = ? ORDER BY recorded_at DESC LIMIT 1",
      [trip.id]
    );

    return res.json({
      success: true,
      trip: { id: trip.id, tripCode: trip.trip_code, status: trip.status },
      latestLocation: locations[0] || null
    });
  } catch (error) {
    console.error("❌ Track error:", error);
    return res.status(500).json({ success: false, error: "Tracking failed" });
  }
});


// GET all trips
app.get("/api/trips", async (req, res) => {
  try {
    console.log("📊 GET /api/trips");
    const [trips] = await db.query(`
      SELECT
        id,
        trip_code,
        driverName,
        carModel,
        COALESCE(pickup_location, pickup) AS pickup,
        destination,
        COALESCE(departure_time, date) AS departure_time,
        COALESCE(passengers, seats) AS passengers,
        fare,
        bookedSeats
      FROM trips
      ORDER BY COALESCE(departure_time, date) ASC
    `);
    
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
        tripCode: trip.trip_code,
        driverName: trip.driverName,
        carModel: trip.carModel,
        pickup: trip.pickup,
        destination: trip.destination,
        date: trip.departure_time,
        seats: trip.passengers,
        fare: trip.fare,
        bookedSeats: bookedSeats,
        availableSeats: (trip.passengers || 0) - bookedSeats.length
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
    
    const tripCode = `RX-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const [result] = await db.query(
      `INSERT INTO trips (
        trip_code,
        driverName,
        carModel,
        pickup,
        pickup_location,
        destination,
        date,
        departure_time,
        seats,
        passengers,
        fare,
        bookedSeats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')`,
      [
        tripCode,
        driverName,
        carModel,
        pickup,
        pickup,
        destination,
        date,
        date,
        parseInt(seats),
        parseInt(seats),
        parseFloat(fare)
      ]
    );
    
    console.log(`✅ Trip added! ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: "Trip added successfully!",
      tripId: result.insertId,
      tripCode
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
    
    const [trips] = await db.query(
      "SELECT bookedSeats, COALESCE(passengers, seats) AS totalSeats FROM trips WHERE id = ?",
      [tripId]
    );
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

    if ((trip.totalSeats || 0) < bookedSeats.length + seats.length) {
      return res.status(400).json({
        success: false,
        error: "Not enough seats available"
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
      `
      SELECT
        id,
        trip_code,
        driverName,
        carModel,
        COALESCE(pickup_location, pickup) AS pickup,
        destination,
        COALESCE(departure_time, date) AS departure_time,
        COALESCE(passengers, seats) AS passengers,
        fare,
        bookedSeats
      FROM trips
      WHERE driverName = ?
      ORDER BY COALESCE(departure_time, date) DESC
      `,
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
        tripCode: trip.trip_code,
        driverName: trip.driverName,
        carModel: trip.carModel,
        pickup: trip.pickup,
        destination: trip.destination,
        date: trip.departure_time,
        seats: trip.passengers,
        fare: trip.fare,
        bookedSeats: bookedSeats,
        availableSeats: (trip.passengers || 0) - bookedSeats.length,
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
      "POST /api/auth/signup - Register user",
      "POST /api/auth/login - User login",
      "GET  /api/trips - List all trips",
      "POST /api/trips - Add new trip",
      "POST /api/book - Book seats",
      "POST /api/trips/search - Search trips",
      "POST /api/trips/book - Book a trip (JWT)",
      "POST /api/payment/initiate - Record payment intent",
      "POST /api/driver/location - Driver GPS updates",
      "GET  /api/track/:tripCode - Track trip",
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
