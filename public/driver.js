// ===== AUTH PROTECTION =====
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "driver") {
  window.location.href = "driver-auth.html";
}

// ===== HELPER FUNCTIONS =====
async function getTripsFromAPI() {
  try {
    const res = await fetch("/api/trips");
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (error) {
    console.error("Error fetching trips:", error);
    return [];
  }
}

async function getMyTrips() {
  const allTrips = await getTripsFromAPI();
  const driverName = user.name || "Driver";
  return allTrips.filter(t => t.driverName === driverName);
}

// ===== MY TRIPS PAGE =====
const myTripsList = document.getElementById("my-trips-list");

if (myTripsList) {
  async function loadMyTrips() {
    const trips = await getMyTrips();

    if (trips.length === 0) {
      myTripsList.innerHTML = "<p style='text-align:center;color:#666'>No trips added yet.</p>";
    } else {
      myTripsList.innerHTML = "";
      trips.forEach(trip => {
        const div = document.createElement("div");
        div.classList.add("trip-card");
        div.innerHTML = `
          <h3>${trip.carModel}</h3>
          <p>${trip.pickup} → ${trip.destination}</p>
          <p>${trip.date}</p>
          <p>Seats: ${trip.availableSeats || trip.seats}</p>
          <p>Fare: PKR ${trip.fare.toLocaleString()}</p>
        `;
        myTripsList.appendChild(div);
      });
    }
  }
  
  loadMyTrips();
}

// ===== BOOKINGS PAGE =====
const bookingsList = document.getElementById("bookings-list");

if (bookingsList) {
  // Since we don't have a bookings API yet, show message
  bookingsList.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <h3>Booking System Coming Soon</h3>
      <p>Passenger bookings will appear here once they book your trips.</p>
      <p>For now, check your trips in the "My Trips" section.</p>
    </div>
  `;
}

// ===== EARNINGS PAGE =====
const earningsStats = document.getElementById("earnings-stats");

if (earningsStats) {
  async function loadEarnings() {
    const trips = await getMyTrips();
    const totalEarnings = trips.reduce((sum, t) => {
      const bookedSeats = t.bookedSeats?.length || 0;
      return sum + (t.fare * bookedSeats);
    }, 0);

    earningsStats.innerHTML = `
      <div class="earning-card">
        <h3>Total Earnings</h3>
        <p>PKR ${totalEarnings.toLocaleString()}</p>
      </div>
      <div class="earning-card">
        <h3>Total Trips</h3>
        <p>${trips.length}</p>
      </div>
      <div class="earning-card">
        <h3>Rating</h3>
        <p>⭐ 4.8</p>
      </div>
    `;
  }
  
  loadEarnings();
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem("user");
  window.location.href = "driver-auth.html";
}

// ===== SETTINGS PAGE =====
const settingsForm = document.getElementById("settings-form");

if (settingsForm) {
  settingsForm.innerHTML = `
    <form id="profile-form">
      <label>Name</label>
      <input type="text" id="name" value="${user.name || ''}" />

      <label>Email</label>
      <input type="email" id="email" value="${user.email || ''}" />

      <label>Phone</label>
      <input type="text" id="phone" value="${user.phone || ''}" />

      <button type="submit">Save Settings</button>
    </form>
  `;

  document.getElementById("profile-form").addEventListener("submit", e => {
    e.preventDefault();
    
    // Update user in localStorage
    const updatedUser = {
      ...user,
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value
    };
    
    localStorage.setItem("user", JSON.stringify(updatedUser));
    alert("Settings saved!");
  });
}
