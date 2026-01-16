// ===== AUTH PROTECTION =====
const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.role !== "passenger") {
  window.location.href = "passenger-auth.html";
}

// ===== PROFILE =====
document.getElementById("passenger-name").textContent = user.name;

// ===== DATA =====
const trips = JSON.parse(localStorage.getItem("trips")) || [];
const bookings = JSON.parse(localStorage.getItem("bookings")) || [];

const myTrips = bookings.filter(b => b.passengerPhone === user.phone);

// ===== STATS =====
document.getElementById("total-trips").textContent = myTrips.length;

const upcoming = myTrips.filter(b => new Date(b.date) >= new Date());
document.getElementById("upcoming-trips").textContent = upcoming.length;

const totalSpent = myTrips.reduce((sum, b) => sum + b.fare, 0);
document.getElementById("total-spent").textContent =
  "PKR " + totalSpent.toLocaleString();

// ===== UPCOMING LIST =====
const upcomingList = document.getElementById("upcoming-list");
if (upcoming.length === 0) {
  upcomingList.innerHTML =
    "<p style='text-align:center;color:#666'>No upcoming trips.</p>";
} else {
  upcoming.forEach(t => {
    const div = document.createElement("div");
    div.className = "trip";
    div.innerHTML = `
      <div>
        <strong>${t.pickup} → ${t.destination}</strong>
        <p>${t.date} • ${t.time}</p>
      </div>
      <span>PKR ${t.fare.toLocaleString()}</span>
    `;
    upcomingList.appendChild(div);
  });
}

// ===== RECENT BOOKINGS =====
const recentList = document.getElementById("recent-list");
if (myTrips.length === 0) {
  recentList.innerHTML =
    "<p style='text-align:center;color:#666'>No bookings yet.</p>";
} else {
  myTrips.slice(0, 5).forEach(t => {
    const div = document.createElement("div");
    div.className = "booking";
    div.innerHTML = `
      <span>${t.pickup} → ${t.destination}</span>
      <span>PKR ${t.fare.toLocaleString()}</span>
    `;
    recentList.appendChild(div);
  });
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem("user");
  window.location.href = "passenger-auth.html";
}
