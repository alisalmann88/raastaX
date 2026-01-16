// ================== DOM ==================
const searchResults = document.getElementById("trip-list");
const dateCarousel = document.getElementById("date-carousel");
const filterBtns = document.querySelectorAll(".filter-btn");

// ================== STATE ==================
let allTrips = [];
let activeFilter = "suggested";

// READ SEARCH DATA FROM INDEX
const searchData = JSON.parse(localStorage.getItem("searchData")) || {};

let selectedDate = searchData.date || new Date().toISOString().split("T")[0];
let startDate = new Date(selectedDate);

// ================== FETCH ==================
async function getTrips() {
  try {
    const res = await fetch("http://localhost:3000/trips");
    const trips = await res.json();

    trips.forEach(t => {
      const d = new Date(t.date);
      d.setHours(d.getHours() + 5); // PKT safe
      t.dateOnly = d.toISOString().split("T")[0];
    });

    return trips;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ================== DATE CAROUSEL ==================
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getCheapestFare(dateStr) {
  const trips = allTrips.filter(t => t.dateOnly === dateStr);
  if (!trips.length) return null;
  return Math.min(...trips.map(t => t.fare));
}

function renderDates() {
  dateCarousel.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    const cheapest = getCheapestFare(dateStr);

    const div = document.createElement("div");
    div.className = "date-box";
    if (dateStr === selectedDate) div.classList.add("active");

    div.innerHTML = `
      <span class="date-main">${day} ${months[d.getMonth()]}</span>
      ${cheapest ? `<span class="date-fare">PKR ${cheapest}</span>` : ""}
    `;

    div.onclick = () => {
      selectedDate = dateStr;
      renderDates();
      filterAndShow();
    };

    dateCarousel.appendChild(div);
  }
}

// ================== ARROWS (FIXED) ==================
function nextWeek() {
  startDate.setDate(startDate.getDate() + 7);
  selectedDate = startDate.toISOString().split("T")[0];
  renderDates();
  filterAndShow();
}

function prevWeek() {
  startDate.setDate(startDate.getDate() - 7);
  selectedDate = startDate.toISOString().split("T")[0];
  renderDates();
  filterAndShow();
}

// ================== FILTER LOGIC ==================
function filterAndShow() {
  let trips = allTrips.filter(t =>
    t.dateOnly === selectedDate &&
    (!searchData.pickup || t.pickup === searchData.pickup) &&
    (!searchData.destination || t.destination === searchData.destination)
  );

  if (activeFilter === "cheapest") {
    trips.sort((a, b) => a.fare - b.fare);
  }

  showTrips(trips);
}

// ================== RENDER ==================
function showTrips(trips) {
  searchResults.innerHTML = "";

  if (!trips.length) {
    searchResults.innerHTML = `
      <div class="no-trips" style="color:var(--blue); font-weight:700;">
        No trips available for this date
      </div>`;
    return;
  }

  trips.forEach(trip => {
    const d = new Date(trip.date);
    d.setHours(d.getHours() + 5);
    const dateStr = `${d.getDate()}-${months[d.getMonth()]}`;

    const div = document.createElement("div");
    div.className = "trip-card";
    div.innerHTML = `
      <h3>${trip.carModel}</h3>
      <p>${trip.pickup} → ${trip.destination}</p>
      <p><strong>${dateStr}</strong></p>
      <p>Seats: ${trip.seats}</p>
      <p style="color:var(--accent); font-size:13px;">PKR ${trip.fare}</p>
      <button class="book-btn">Book</button>
    `;

    div.querySelector(".book-btn").onclick = () => {
      localStorage.setItem("bookingData", JSON.stringify({ trip }));
      window.location.href = "booking.html";
    };

    searchResults.appendChild(div);
  });
}

// ================== FILTER BUTTONS ==================
filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    filterAndShow();
  };
});

// ================== INIT ==================
(async function init() {
  allTrips = await getTrips();
  renderDates();
  filterAndShow();
})();
