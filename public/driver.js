// ======== DRIVER.JS ========

// ===== AUTH PROTECTION =====
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "driver") {
  window.location.href = "driver-auth.html";
}

// ===== DRIVER PROFILE (TEMP FROM AUTH) =====
const driverProfile = {
  name: user.phone || "Driver",
  email: "",
  phone: user.phone,
  rating: 4.8
};

// ===== HELPER FUNCTIONS =====
function getTrips() {
  return JSON.parse(localStorage.getItem("trips")) || [];
}

function getBookings() {
  return JSON.parse(localStorage.getItem("bookings")) || [];
}

// ===== MY TRIPS PAGE =====
const myTripsList = document.getElementById("my-trips-list");

if (myTripsList) {
  const trips = getTrips().filter(t => t.driverPhone === user.phone);

  if (trips.length === 0) {
    myTripsList.innerHTML =
      "<p style='text-align:center;color:#666'>No trips added yet.</p>";
  } else {
    trips.forEach(t => {
      const div = document.createElement("div");
      div.classList.add("trip-card");
      div.innerHTML = `
        <h3>${t.carModel}</h3>
        <p>${t.pickup} → ${t.destination}</p>
        <p>${t.date} • ${t.time}</p>
        <p>Seats: ${t.seats}</p>
        <p>Fare: PKR ${t.fare.toLocaleString()}</p>
      `;
      myTripsList.appendChild(div);
    });
  }
}

// ===== BOOKINGS PAGE =====
const bookingsList = document.getElementById("bookings-list");

if (bookingsList) {
  const bookings = getBookings().filter(b => b.driverPhone === user.phone);

  if (bookings.length === 0) {
    bookingsList.innerHTML =
      "<p style='text-align:center;color:#666'>No bookings yet.</p>";
  } else {
    bookings.forEach(b => {
      const div = document.createElement("div");
      div.classList.add("booking-card");
      div.innerHTML = `
        <h3>${b.fullname}</h3>
        <p>${b.pickup} → ${b.destination}</p>
        <p>${b.date} • ${b.time}</p>
        <p>Fare: PKR ${b.fare.toLocaleString()}</p>
      `;
      bookingsList.appendChild(div);
    });
  }
}

// ===== EARNINGS PAGE =====
const earningsStats = document.getElementById("earnings-stats");

if (earningsStats) {
  const bookings = getBookings().filter(b => b.driverPhone === user.phone);
  const totalEarnings = bookings.reduce((sum, b) => sum + b.fare, 0);

  earningsStats.innerHTML = `
    <div class="earning-card">
      <h3>Total Earnings</h3>
      <p>PKR ${totalEarnings.toLocaleString()}</p>
    </div>
    <div class="earning-card">
      <h3>Total Bookings</h3>
      <p>${bookings.length}</p>
    </div>
    <div class="earning-card">
      <h3>Rating</h3>
      <p>⭐ ${driverProfile.rating}</p>
    </div>
  `;
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
      <input type="text" id="name" value="${driverProfile.name}" />

      <label>Email</label>
      <input type="email" id="email" value="${driverProfile.email}" />

      <label>Phone</label>
      <input type="text" id="phone" value="${driverProfile.phone}" disabled />

      <button type="submit">Save Settings</button>
    </form>
  `;

  document.getElementById("profile-form").addEventListener("submit", e => {
    e.preventDefault();
    driverProfile.name = document.getElementById("name").value;
    driverProfile.email = document.getElementById("email").value;
    alert("Settings saved (local only)");
  });
}
// ======== DRIVER.JS ========

// ===== AUTH PROTECTION =====
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "driver") {
  window.location.href = "driver-auth.html";
}

// ===== DRIVER PROFILE (TEMP FROM AUTH) =====
const driverProfile = {
  name: user.phone || "Driver",
  email: "",
  phone: user.phone,
  rating: 4.8
};

// ===== HELPER FUNCTIONS =====
function getTrips() {
  return JSON.parse(localStorage.getItem("trips")) || [];
}

function getBookings() {
  return JSON.parse(localStorage.getItem("bookings")) || [];
}

// ===== MY TRIPS PAGE =====
const myTripsList = document.getElementById("my-trips-list");

if (myTripsList) {
  const trips = getTrips().filter(t => t.driverPhone === user.phone);

  if (trips.length === 0) {
    myTripsList.innerHTML =
      "<p style='text-align:center;color:#666'>No trips added yet.</p>";
  } else {
    trips.forEach(t => {
      const div = document.createElement("div");
      div.classList.add("trip-card");
      div.innerHTML = `
        <h3>${t.carModel}</h3>
        <p>${t.pickup} → ${t.destination}</p>
        <p>${t.date} • ${t.time}</p>
        <p>Seats: ${t.seats}</p>
        <p>Fare: PKR ${t.fare.toLocaleString()}</p>
      `;
      myTripsList.appendChild(div);
    });
  }
}

// ===== BOOKINGS PAGE =====
const bookingsList = document.getElementById("bookings-list");

if (bookingsList) {
  const bookings = getBookings().filter(b => b.driverPhone === user.phone);

  if (bookings.length === 0) {
    bookingsList.innerHTML =
      "<p style='text-align:center;color:#666'>No bookings yet.</p>";
  } else {
    bookings.forEach(b => {
      const div = document.createElement("div");
      div.classList.add("booking-card");
      div.innerHTML = `
        <h3>${b.fullname}</h3>
        <p>${b.pickup} → ${b.destination}</p>
        <p>${b.date} • ${b.time}</p>
        <p>Fare: PKR ${b.fare.toLocaleString()}</p>
      `;
      bookingsList.appendChild(div);
    });
  }
}

// ===== EARNINGS PAGE =====
const earningsStats = document.getElementById("earnings-stats");

if (earningsStats) {
  const bookings = getBookings().filter(b => b.driverPhone === user.phone);
  const totalEarnings = bookings.reduce((sum, b) => sum + b.fare, 0);

  earningsStats.innerHTML = `
    <div class="earning-card">
      <h3>Total Earnings</h3>
      <p>PKR ${totalEarnings.toLocaleString()}</p>
    </div>
    <div class="earning-card">
      <h3>Total Bookings</h3>
      <p>${bookings.length}</p>
    </div>
    <div class="earning-card">
      <h3>Rating</h3>
      <p>⭐ ${driverProfile.rating}</p>
    </div>
  `;
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
      <input type="text" id="name" value="${driverProfile.name}" />

      <label>Email</label>
      <input type="email" id="email" value="${driverProfile.email}" />

      <label>Phone</label>
      <input type="text" id="phone" value="${driverProfile.phone}" disabled />

      <button type="submit">Save Settings</button>
    </form>
  `;

  document.getElementById("profile-form").addEventListener("submit", e => {
    e.preventDefault();
    driverProfile.name = document.getElementById("name").value;
    driverProfile.email = document.getElementById("email").value;
    alert("Settings saved (local only)");
  });
}
