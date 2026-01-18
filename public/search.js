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

// ================== FETCH - FIXED ==================
async function getTrips() {
  try {
    // ✅ FIXED: Changed from localhost:3000 to /api/trips
    const res = await fetch("/api/trips");
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const trips = await res.json();
    console.log(`✅ Fetched ${trips.length} trips from API`);

    // Process dates
    trips.forEach(t => {
      const d = new Date(t.date);
      d.setHours(d.getHours() + 5); // PKT safe
      t.dateOnly = d.toISOString().split("T")[0];
      t.formattedDate = `${d.getDate()} ${months[d.getMonth()]}`;
    });

    return trips;
  } catch (err) {
    console.error("❌ Error fetching trips:", err);
    
    // Fallback: Try with full URL
    try {
      console.log("🔄 Trying fallback URL...");
      const fallbackRes = await fetch("https://raastax-production.up.railway.app/api/trips");
      if (fallbackRes.ok) {
        const fallbackTrips = await fallbackRes.json();
        console.log(`✅ Fallback fetched ${fallbackTrips.length} trips`);
        return fallbackTrips;
      }
    } catch (fallbackErr) {
      console.error("Fallback also failed:", fallbackErr);
    }
    
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

// ================== ARROWS ==================
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

// ================== FILTER LOGIC - IMPROVED ==================
function filterAndShow() {
  let trips = allTrips.filter(t => {
    // Check date
    if (t.dateOnly !== selectedDate) return false;
    
    // Check pickup (case insensitive, partial match)
    if (searchData.pickup && !t.pickup.toLowerCase().includes(searchData.pickup.toLowerCase())) {
      return false;
    }
    
    // Check destination
    if (searchData.destination && !t.destination.toLowerCase().includes(searchData.destination.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (activeFilter === "cheapest") {
    trips.sort((a, b) => a.fare - b.fare);
  }

  showTrips(trips);
}

// ================== RENDER - IMPROVED ==================
function showTrips(trips) {
  searchResults.innerHTML = "";

  if (!trips.length) {
    searchResults.innerHTML = `
      <div class="no-trips">
        <i class="fas fa-car" style="font-size: 3em; color: var(--blue); margin-bottom: 10px;"></i>
        <h3>No trips found</h3>
        <p>No trips available for ${selectedDate}</p>
        ${searchData.pickup ? `<p>From: ${searchData.pickup}</p>` : ''}
        ${searchData.destination ? `<p>To: ${searchData.destination}</p>` : ''}
        <p style="margin-top: 20px;">Try searching for different dates or routes</p>
      </div>`;
    return;
  }

  trips.forEach(trip => {
    const div = document.createElement("div");
    div.className = "trip-card";
    div.innerHTML = `
      <div class="trip-header">
        <h3>${trip.carModel}</h3>
        <span class="driver">👤 ${trip.driverName}</span>
      </div>
      
      <div class="trip-route">
        <span class="from">${trip.pickup}</span>
        <i class="fas fa-arrow-right"></i>
        <span class="to">${trip.destination}</span>
      </div>
      
      <div class="trip-details">
        <div class="detail">
          <i class="far fa-calendar"></i>
          <span>${trip.formattedDate || 'Date not set'}</span>
        </div>
        <div class="detail">
          <i class="fas fa-users"></i>
          <span>${trip.availableSeats || trip.seats} seats available</span>
        </div>
        <div class="detail">
          <i class="fas fa-tag"></i>
          <span class="fare">PKR ${trip.fare}</span>
        </div>
      </div>
      
      <button class="book-btn">
        <i class="fas fa-ticket-alt"></i> Book Now
      </button>
    `;

    div.querySelector(".book-btn").onclick = () => {
      localStorage.setItem("bookingData", JSON.stringify({ 
        trip: {
          id: trip.id,
          driverName: trip.driverName,
          carModel: trip.carModel,
          pickup: trip.pickup,
          destination: trip.destination,
          date: trip.date,
          seats: trip.availableSeats || trip.seats,
          fare: trip.fare
        }
      }));
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

// ================== DEBUG ==================
function debugTrips() {
  console.log("=== DEBUG TRIPS ===");
  console.log("All trips:", allTrips);
  console.log("Search data:", searchData);
  console.log("Selected date:", selectedDate);
  console.log("Active filter:", activeFilter);
}

// ================== INIT ==================
(async function init() {
  console.log("🔄 Initializing search page...");
  console.log("Search data from localStorage:", searchData);
  
  allTrips = await getTrips();
  console.log(`✅ Loaded ${allTrips.length} trips`);
  
  // If no trips, show message
  if (allTrips.length === 0) {
    console.warn("⚠️ No trips loaded from API");
    searchResults.innerHTML = `
      <div class="no-trips">
        <h3>No trips in database</h3>
        <p>Add some trips from the Driver panel first!</p>
        <button onclick="window.location.href='add-trip.html'" style="margin-top: 20px; padding: 10px 20px; background: var(--blue); color: white; border: none; border-radius: 5px;">
          Add Trip
        </button>
      </div>
    `;
  }
  
  renderDates();
  filterAndShow();
  debugTrips();
})();

// Add to global scope for debugging
window.debugTrips = debugTrips;
window.getAllTrips = () => allTrips;
