const myTripList = document.getElementById("my-trips-list");

// Get current driver name - SAME LOGIC AS add-trip.js
function getCurrentDriverName() {
  console.log("🔍 Getting current driver name for my-trips...");
  
  // Try multiple sources (same as add-trip.js)
  const user = JSON.parse(localStorage.getItem("user")) || {};
  if (user.role === "driver" && user.name) {
    console.log("✅ Using driver name from user object:", user.name);
    return user.name;
  }
  
  const driverObj = JSON.parse(localStorage.getItem("driver")) || {};
  if (driverObj.name) {
    console.log("✅ Using driver name from driver object:", driverObj.name);
    return driverObj.name;
  }
  
  if (user.name) {
    console.log("✅ Using name from user object:", user.name);
    return user.name;
  }
  
  console.log("❌ No driver name found");
  return "Driver";
}

async function getDriverTrips() {
  try {
    const driverName = getCurrentDriverName();
    console.log("🔍 Looking for trips by driver:", driverName);
    
    // First, try driver-specific endpoint
    const res = await fetch(`/api/driver/trips?driverName=${encodeURIComponent(driverName)}`);
    
    console.log("API Response status:", res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log("Driver trips API response:", data);
      
      if (data.success) {
        console.log(`✅ Found ${data.trips.length} trips for driver ${driverName}`);
        return data.trips;
      }
    }
    
    // Fallback: get all trips and filter
    console.log("🔄 Falling back to general trips API...");
    const fallbackRes = await fetch("/api/trips");
    if (fallbackRes.ok) {
      const allTrips = await fallbackRes.json();
      console.log("All trips from API:", allTrips);
      
      // Filter trips by driver name
      const driverTrips = allTrips.filter(trip => 
        trip.driverName === driverName || 
        trip.driverName === "Driver" // Also show generic "Driver" trips
      );
      
      console.log(`Filtered ${driverTrips.length} trips for driver ${driverName}`);
      return driverTrips;
    }
    
    return [];
    
  } catch (err) {
    console.error("❌ Error fetching driver trips:", err);
    return [];
  }
}

async function showMyTrips() {
  if (!myTripList) return;
  
  myTripList.innerHTML = `<div style="text-align:center;padding:20px;color:#666;">
    <i class="fas fa-spinner fa-spin"></i> Loading your trips...
  </div>`;
  
  const trips = await getDriverTrips();
  console.log("Trips to display:", trips);

  if (trips.length === 0) {
    const driverName = getCurrentDriverName();
    myTripList.innerHTML = `
      <div style="text-align:center;padding:40px;background:#f8f9fa;border-radius:10px;">
        <i class="fas fa-car" style="font-size:3em;color:var(--blue);margin-bottom:20px;"></i>
        <h3 style="color:var(--blue);">No trips found</h3>
        <p style="color:#666;margin-bottom:20px;">You haven't added any trips yet.</p>
        
        <div style="background:#e8f4ff;padding:15px;border-radius:8px;margin-bottom:20px;text-align:left;">
          <p><strong>Debug Info:</strong></p>
          <p>Logged in as: <strong>${driverName}</strong></p>
          <p>Looking for trips by driver name: <strong>"${driverName}"</strong></p>
          <p>Make sure when you add trips, the driver name matches exactly.</p>
        </div>
        
        <button onclick="window.location.href='add-trip.html'" 
                style="margin-top:20px;padding:12px 24px;background:var(--blue);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">
          <i class="fas fa-plus-circle"></i> Add Your First Trip
        </button>
        
        <p style="margin-top:20px;font-size:0.9em;color:#888;">
          <button onclick="debugTrips()" style="background:none;border:1px solid #ddd;padding:5px 10px;border-radius:4px;cursor:pointer;margin-right:10px;">
            Debug
          </button>
          <button onclick="window.location.href='driver-auth.html'" style="background:none;border:1px solid #ddd;padding:5px 10px;border-radius:4px;cursor:pointer;">
            Re-login
          </button>
        </p>
      </div>
    `;
    return;
  }

  myTripList.innerHTML = "";
  
  trips.forEach(trip => {
    const tripDate = new Date(trip.date);
    tripDate.setHours(tripDate.getHours() + 5);

    const dateStr = tripDate.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const bookedCount = trip.bookedSeats?.length || 0;
    const earnings = trip.fare * bookedCount;
    
    const div = document.createElement("div");
    div.className = "trip-card";
    div.innerHTML = `
      <div class="trip-header">
        <h3>${trip.carModel}</h3>
        <span class="trip-status ${trip.availableSeats > 0 ? 'available' : 'full'}">
          ${trip.availableSeats > 0 ? '🟢 Available' : '🔴 Full'}
        </span>
      </div>
      
      <div class="trip-route">
        <span class="from">${trip.pickup}</span>
        <i class="fas fa-arrow-right"></i>
        <span class="to">${trip.destination}</span>
      </div>
      
      <div class="trip-meta">
        <span><i class="far fa-user"></i> ${trip.driverName}</span>
        <span><i class="far fa-calendar"></i> ${dateStr}</span>
      </div>
      
      <div class="trip-details">
        <div class="detail">
          <i class="fas fa-chair"></i>
          <span>${trip.availableSeats}/${trip.seats} seats</span>
        </div>
        <div class="detail">
          <i class="fas fa-tag"></i>
          <span>PKR ${trip.fare.toLocaleString()}</span>
        </div>
        <div class="detail">
          <i class="fas fa-users"></i>
          <span>${bookedCount} booked</span>
        </div>
      </div>
      
      <div class="trip-footer">
        <span class="earnings">
          <i class="fas fa-wallet"></i> Earnings: PKR ${earnings.toLocaleString()}
        </span>
        <button class="view-btn" onclick="alert('Trip ID: ${trip.id}\\nDriver: ${trip.driverName}')">
          <i class="fas fa-eye"></i> Details
        </button>
      </div>
    `;
    myTripList.appendChild(div);
  });
}

// Debug function
function debugTrips() {
  console.log("=== MY-TRIPS DEBUG ===");
  const driverName = getCurrentDriverName();
  console.log("Current driver name:", driverName);
  
  // Test API
  fetch("/api/trips")
    .then(res => res.json())
    .then(trips => {
      console.log("All trips from API:", trips);
      console.log("Trips matching current driver:", 
        trips.filter(t => t.driverName === driverName || t.driverName === "Driver"));
    })
    .catch(console.error);
}

// Initial load
showMyTrips();

// Auto-refresh every 10 seconds
setInterval(showMyTrips, 10000);

// Add debug to window
window.debugTrips = debugTrips;
