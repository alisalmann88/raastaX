let lastLocation = null;
let lastUpdateTime = null;
let averageSpeed = 70; // km/h

function onTripStart() {
  const trackingID = generateTrackingID();
  sendTrackingLinkToFamily(trackingID);
  updateStatus("Trip started");
}

function updateLocation(isOnline, currentGPS) {
  const now = Date.now();

  if (isOnline && currentGPS) {
    lastLocation = currentGPS;
    lastUpdateTime = now;
    showOnMap(currentGPS, "Live location");
  } 
  else if (lastLocation && lastUpdateTime) {
    const timePassedHours = (now - lastUpdateTime) / (1000 * 60 * 60);
    const estimatedDistance = averageSpeed * timePassedHours;

    const estimatedLocation = estimateFromRoute(
      lastLocation,
      estimatedDistance
    );

    showOnMap(estimatedLocation, "Estimated (Low Signal)");
  } 
  else {
    updateStatus("Waiting for first GPS signal...");
  }
}

function checkStop(speed) {
  if (speed < 5) {
    updateStatus("Vehicle stopped — possible break");
  }
}

function onTripEnd() {
  updateStatus("Trip completed safely");
  notifyFamily("Trip completed safely");
}

/* -------- Helper Functions (Basic) -------- */

function generateTrackingID() {
  return "RC-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function sendTrackingLinkToFamily(trackingID) {
  console.log("Tracking Link:", `https://raastax.com/track/${trackingID}`);
}

function showOnMap(location, label) {
  document.getElementById("locationText").innerText =
    `${label}: ${location.lat}, ${location.lng}`;
}

function updateStatus(text) {
  document.getElementById("statusText").innerText = text;
}

function estimateFromRoute(lastLocation, distanceKm) {
  // Dummy estimation (forward movement)
  return {
    lat: lastLocation.lat + distanceKm * 0.0009,
    lng: lastLocation.lng
  };
}
