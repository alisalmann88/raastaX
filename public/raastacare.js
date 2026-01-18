// raastacare.js - Enhanced with route segments & simulation

// Route segments data (Gilgit → Islamabad via KKH/Babusar)
const routeSegments = [
  { name: "Gilgit → Jaglot", distance: 45, avgSpeed: 50, hasSignal: true },
  { name: "Jaglot → Chilas", distance: 90, avgSpeed: 40, hasSignal: false },
  { name: "Chilas → Dassu", distance: 20, avgSpeed: 60, hasSignal: true },
  { name: "Dassu → Babusar Base", distance: 60, avgSpeed: 30, hasSignal: false },
  { name: "Babasur Pass Crossing", distance: 50, avgSpeed: 20, hasSignal: false },
  { name: "Babusar → Naran", distance: 40, avgSpeed: 40, hasSignal: true },
  { name: "Naran → Islamabad", distance: 250, avgSpeed: 70, hasSignal: true },
];

let currentSegmentIndex = 0;
let tripActive = false;
let lastKnownLocation = { lat: 35.9208, lng: 74.3144 }; // Gilgit
let simulationInterval = null;

// ========== UI FUNCTIONS ==========

function lookupTrip() {
  const bookingId = document.getElementById("bookingId").value.trim();
  if (!bookingId) {
    alert("Please enter Booking ID or Vehicle Number");
    return;
  }
  
  // Simulate fetching trip from backend
  document.getElementById("statusText").innerText = "Trip found! Simulating journey...";
  startTripSimulation();
}

function startTripSimulation() {
  if (tripActive) return;
  tripActive = true;
  currentSegmentIndex = 0;
  
  // Generate tracking ID and link
  const trackingID = generateTrackingID();
  sendTrackingLinkToFamily(trackingID);
  
  // Start simulating location updates
  simulationInterval = setInterval(updateSimulatedLocation, 5000); // every 5 sec
  
  updateStatus(`Trip started. Tracking ID: ${trackingID}`);
  updateSignalStatus("🟢 Good Signal");
}

function updateSimulatedLocation() {
  if (currentSegmentIndex >= routeSegments.length) {
    endTrip();
    return;
  }
  
  const segment = routeSegments[currentSegmentIndex];
  const isOnline = segment.hasSignal;
  
  // Simulate GPS movement (mock coordinates advancing north-east)
  if (isOnline) {
    lastKnownLocation.lat += 0.01;
    lastKnownLocation.lng += 0.005;
    showOnMap(lastKnownLocation, "Live Location");
    updateSignalStatus("🟢 Good Signal");
  } else {
    // Dead zone: estimate based on segment avg speed
    const estimatedLocation = estimateInDeadZone(lastKnownLocation, segment.avgSpeed);
    showOnMap(estimatedLocation, "Estimated (No Signal)");
    updateSignalStatus("🔴 No Signal - Estimating");
    
    // Detect if in Dassu (common stop)
    if (segment.name.includes("Dassu")) {
      updateStatus("Lunch break at Dassu - 30 min stop");
    }
  }
  
  // Update UI
  document.getElementById("routeText").innerText = `Gilgit → Islamabad (${segment.name})`;
  document.getElementById("locationText").innerText = 
    `${lastKnownLocation.lat.toFixed(4)}, ${lastKnownLocation.lng.toFixed(4)}`;
  
  // Move to next segment after "completing" it
  setTimeout(() => {
    currentSegmentIndex++;
  }, 15000); // Simulate segment taking time
}

function estimateInDeadZone(lastLoc, speedKmH) {
  // More realistic: move along route, not just lat++
  const hoursPassed = 0.0833; // 5 minutes in hours
  const distanceKm = speedKmH * hoursPassed;
  const latChange = distanceKm * 0.009; // Rough conversion
  const lngChange = distanceKm * 0.009;
  
  return {
    lat: lastLoc.lat + latChange,
    lng: lastLoc.lng + lngChange
  };
}

function endTrip() {
  clearInterval(simulationInterval);
  tripActive = false;
  updateStatus("Trip completed safely 🎉");
  updateSignalStatus("Trip Ended");
  notifyFamily("Trip completed safely");
}

// ========== HELPER FUNCTIONS ==========

function generateTrackingID() {
  return "RC-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function sendTrackingLinkToFamily(trackingID) {
  console.log("Share this with family: ", `https://raastax.com/track/${trackingID}`);
  // In real app: send SMS/email via backend
}

function showOnMap(location, label) {
  // In real app: update map marker using Leaflet/Google Maps
  document.getElementById("locationText").innerText = 
    `${label}: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}

function updateStatus(text) {
  document.getElementById("statusText").innerText = text;
}

function updateSignalStatus(text) {
  const el = document.getElementById("signalText");
  if (el) el.innerText = text;
}

function notifyFamily(message) {
  console.log(`Notification to family: ${message}`);
  // Backend: send push/SMS
}

// ========== INITIALIZE ==========
// Add simple map placeholder (in real app, use Leaflet/Google Maps)
function initMap() {
  const mapEl = document.getElementById("map");
  if (mapEl) {
    mapEl.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>📍 Map would show here (Leaflet/Google Maps integration)</p>
        <p>Vehicle marker moves along Gilgit → Islamabad route</p>
        <p>Green = Live GPS, Red = Estimated, Yellow = Break</p>
      </div>
    `;
  }
}

// Call when page loads
window.onload = initMap;
