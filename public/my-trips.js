const myTripList = document.getElementById("my-trips-list");

async function getTrips() {
  try {
    const res = await fetch("http://localhost:3000/trips");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function showMyTrips() {
  myTripList.innerHTML = "";
  const trips = await getTrips();
  const driverName = "Driver";

  const myTrips = trips.filter(t => t.driverName === driverName);

  if (myTrips.length === 0) {
    myTripList.innerHTML = "<p style='color: var(--blue); font-weight:700;'>No trips added yet</p>";
    return;
  }

  myTrips.forEach(trip => {
    // ✅ PKT-safe date
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
      <h3>${trip.carModel}</h3>
      <p>${trip.pickup} → ${trip.destination}</p>
      <p>${dateStr}</p>
      <p>Seats: ${trip.seats}</p>
      <p>PKR ${trip.fare}</p>
    `;
    myTripList.appendChild(div);
  });
}

// 🔄 Refresh every 3 sec
showMyTrips();
setInterval(showMyTrips, 3000);
