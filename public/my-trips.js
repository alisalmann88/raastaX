const myTripList = document.getElementById("my-trips-list");

async function getTrips() {
  try {
    // ✅ FIXED: Changed from localhost:3000 to /api/trips
    const res = await fetch("/api/trips");
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error fetching trips:", err);
    
    // Try fallback URL
    try {
      const fallbackRes = await fetch("https://raastax-production.up.railway.app/api/trips");
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch (fallbackErr) {
      console.error("Fallback also failed:", fallbackErr);
    }
    
    return [];
  }
}

async function showMyTrips() {
  myTripList.innerHTML = "";
  const trips = await getTrips();
  
  // Get current driver name from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const driverName = user.name || "Driver";

  const myTrips = trips.filter(t => t.driverName === driverName);

  if (myTrips.length === 0) {
    myTripList.innerHTML = "<p style='color: var(--blue); font-weight:700;'>No trips added yet</p>";
    return;
  }

  myTrips.forEach(trip => {
    const tripDate = new Date(trip.date);
    tripDate.setHours(tripDate.getHours() + 5);

    const dateStr = tripDate.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const div = document.createElement("div");
    div.className = "trip-card";
    div.innerHTML = `
      <h3>${trip.carModel}</h3>
      <p>${trip.pickup} → ${trip.destination}</p>
      <p>${dateStr}</p>
      <p>Seats: ${trip.availableSeats || trip.seats}</p>
      <p>PKR ${trip.fare}</p>
    `;
    myTripList.appendChild(div);
  });
}

showMyTrips();
setInterval(showMyTrips, 5000); // Refresh every 5 seconds
