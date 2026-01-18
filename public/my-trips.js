const myTripList = document.getElementById("my-trips-list");

async function getDriverTrips() {
  try {
    // Get current driver from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const driverName = user.name || "Driver";
    
    if (!driverName || driverName === "Driver") {
      console.warn("⚠️ No driver name found in localStorage");
      return [];
    }
    
    // ✅ Use new driver-specific endpoint
    const res = await fetch(`/api/driver/trips?driverName=${encodeURIComponent(driverName)}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.success) {
      console.log(`✅ Found ${data.trips.length} trips for driver ${driverName}`);
      return data.trips;
    } else {
      console.error("API returned error:", data.error);
      return [];
    }
    
  } catch (err) {
    console.error("❌ Error fetching driver trips:", err);
    
    // Fallback: try the general trips endpoint
    try {
      console.log("🔄 Trying fallback to general trips API...");
      const fallbackRes = await fetch("/api/trips");
      if (fallbackRes.ok) {
        const allTrips = await fallbackRes.json();
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const driverName = user.name || "Driver";
        
        // Filter trips by driver name
        return allTrips.filter(trip => trip.driverName === driverName);
      }
    } catch (fallbackErr) {
      console.error("Fallback also failed:", fallbackErr);
    }
    
    return [];
  }
}

async function showMyTrips() {
  myTripList.innerHTML = `<div style="text-align:center;padding:20px;">
    <i class="fas fa-spinner fa-spin"></i> Loading trips...
  </div>`;
  
  const trips = await getDriverTrips();

  if (trips.length === 0) {
    myTripList.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--blue);">
        <i class="fas fa-car" style="font-size:3em;margin-bottom:20px;"></i>
        <h3>No trips found</h3>
        <p>You haven't added any trips yet.</p>
        <button onclick="window.location.href='add-trip.html'" 
                style="margin-top:20px;padding:10px 20px;background:var(--blue);color:white;border:none;border-radius:5px;cursor:pointer;">
          Add Your First Trip
        </button>
      </div>
    `;
    return;
  }

  myTripList.innerHTML = "";
  
  trips.forEach(trip => {
    const tripDate = new Date(trip.date);
    tripDate.setHours(tripDate.getHours() + 5); // Pakistan UTC+5

    const dateStr = tripDate.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const div = document.createElement("div");
    div.className = "trip-card";
    div.innerHTML = `
      <div class="trip-header">
        <h3>${trip.carModel}</h3>
        <span class="trip-status">${trip.availableSeats > 0 ? '🟢 Available' : '🔴 Full'}</span>
      </div>
      <div class="trip-route">
        <span class="from">${trip.pickup}</span>
        <i class="fas fa-arrow-right"></i>
        <span class="to">${trip.destination}</span>
      </div>
      <div class="trip-details">
        <div class="detail">
          <i class="far fa-calendar"></i>
          <span>${dateStr}</span>
        </div>
        <div class="detail">
          <i class="fas fa-users"></i>
          <span>${trip.availableSeats}/${trip.seats} seats</span>
        </div>
        <div class="detail">
          <i class="fas fa-tag"></i>
          <span>PKR ${trip.fare}</span>
        </div>
      </div>
      <div class="trip-footer">
        <span class="earnings">Earnings: PKR ${(trip.fare * (trip.seats - trip.availableSeats)).toLocaleString()}</span>
      </div>
    `;
    myTripList.appendChild(div);
  });
}

// Initial load
showMyTrips();

// Auto-refresh every 10 seconds
setInterval(showMyTrips, 10000);
