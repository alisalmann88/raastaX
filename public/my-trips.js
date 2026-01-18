const myTripList = document.getElementById("my-trips-list");

async function getDriverTrips() {
  try {
    // Get current driver from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    console.log("Current user from localStorage:", user);
    
    const driverName = user.name || user.phone || "Driver";
    console.log("Looking for trips by driver:", driverName);
    
    if (!driverName || driverName === "Driver") {
      console.warn("⚠️ No driver name found. Please log in as driver.");
      return [];
    }
    
    // Try new driver-specific endpoint
    const res = await fetch(`/api/driver/trips?driverName=${encodeURIComponent(driverName)}`);
    
    console.log("API Response status:", res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("API Response data:", data);
    
    if (data.success) {
      console.log(`✅ Found ${data.trips.length} trips for driver ${driverName}`);
      return data.trips;
    } else {
      console.error("API returned error:", data.error);
      return [];
    }
    
  } catch (err) {
    console.error("❌ Error fetching driver trips:", err);
    
    // Fallback: get all trips and filter
    try {
      console.log("🔄 Trying fallback...");
      const fallbackRes = await fetch("/api/trips");
      if (fallbackRes.ok) {
        const allTrips = await fallbackRes.json();
        console.log("All trips from API:", allTrips);
        
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const driverName = user.name || user.phone || "Driver";
        
        // Filter trips by driver name
        const driverTrips = allTrips.filter(trip => 
          trip.driverName === driverName || 
          trip.driverName === "Driver" // Also show trips with generic "Driver" name
        );
        
        console.log(`Filtered ${driverTrips.length} trips for driver ${driverName}`);
        return driverTrips;
      }
    } catch (fallbackErr) {
      console.error("Fallback also failed:", fallbackErr);
    }
    
    return [];
  }
}

async function showMyTrips() {
  myTripList.innerHTML = `<div style="text-align:center;padding:20px;color:#666;">
    <i class="fas fa-spinner fa-spin"></i> Loading your trips...
  </div>`;
  
  const trips = await getDriverTrips();
  console.log("Trips to display:", trips);

  if (trips.length === 0) {
    myTripList.innerHTML = `
      <div style="text-align:center;padding:40px;background:#f8f9fa;border-radius:10px;">
        <i class="fas fa-car" style="font-size:3em;color:var(--blue);margin-bottom:20px;"></i>
        <h3 style="color:var(--blue);">No trips found</h3>
        <p style="color:#666;margin-bottom:20px;">You haven't added any trips yet.</p>
        
        <div style="background:#e8f4ff;padding:15px;border-radius:8px;margin-bottom:20px;">
          <p><strong>Debug Info:</strong></p>
          <p>Logged in as: ${JSON.parse(localStorage.getItem("user"))?.name || "Not logged in"}</p>
          <p>User role: ${JSON.parse(localStorage.getItem("user"))?.role || "Not set"}</p>
        </div>
        
        <button onclick="window.location.href='add-trip.html'" 
                style="margin-top:20px;padding:12px 24px;background:var(--blue);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">
          <i class="fas fa-plus-circle"></i> Add Your First Trip
        </button>
        
        <p style="margin-top:20px;font-size:0.9em;color:#888;">
          <button onclick="debugTrips()" style="background:none;border:1px solid #ddd;padding:5px 10px;border-radius:4px;cursor:pointer;">
            Debug
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
        <button class="view-btn" onclick="viewTrip(${trip.id})">
          <i class="fas fa-eye"></i> View
        </button>
      </div>
    `;
    myTripList.appendChild(div);
  });
}

// Debug function
function debugTrips() {
  console.log("=== DEBUG INFO ===");
  console.log("LocalStorage user:", JSON.parse(localStorage.getItem("user")));
  
  // Test API endpoints
  fetch("/api/trips")
    .then(res => res.json())
    .then(trips => {
      console.log("All trips from API:", trips);
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const driverName = user.name || user.phone || "Driver";
      console.log("Trips for driver", driverName, ":", 
        trips.filter(t => t.driverName === driverName || t.driverName === "Driver"));
    })
    .catch(console.error);
}

function viewTrip(tripId) {
  alert(`Viewing trip ID: ${tripId}`);
  // You can implement detailed view later
}

// Initial load
showMyTrips();

// Auto-refresh every 5 seconds
setInterval(showMyTrips, 5000);

// Add debug to window
window.debugTrips = debugTrips;
