let map;
let vehicleMarker;
let routeLine;

function initMap() {
  // Initialize map centered on Gilgit
  map = L.map('map').setView([35.9208, 74.3144], 9);
  
  // Add OpenStreetMap tiles (FREE)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);
  
  // Draw route from Gilgit to Islamabad
  const routeCoordinates = [
    [35.9208, 74.3144], // Gilgit
    [35.7680, 74.2776], // Jaglot
    [35.4182, 74.0981], // Chilas
    [35.2600, 73.9800], // Dassu
    [35.0000, 73.8000], // Babusar Base
    [34.8500, 73.6500], // Babusar Top
    [34.9064, 73.6480], // Naran
    [33.6844, 73.0479]  // Islamabad
  ];
  
  // Draw the route line
  routeLine = L.polyline(routeCoordinates, {
    color: '#1f4fd8',
    weight: 4,
    opacity: 0.7,
    dashArray: '10, 10'
  }).addTo(map);
  
  // Add markers for checkpoints
  const checkpointNames = ['Gilgit', 'Jaglot', 'Chilas', 'Dassu', 'Babusar Base', 'Babusar Top', 'Naran', 'Islamabad'];
  
  routeCoordinates.forEach((coord, index) => {
    L.marker(coord)
      .addTo(map)
      .bindPopup(`<b>${checkpointNames[index]}</b><br>Checkpoint ${index + 1}`)
      .openPopup();
  });
  
  // Fit map to show entire route
  map.fitBounds(routeLine.getBounds());
  
  console.log("✅ Leaflet map loaded successfully!");
}

// Function to update vehicle position
function updateVehicleOnMap(lat, lng, isEstimated = false) {
  const newLatLng = [lat, lng];
  
  if (!vehicleMarker) {
    // Create vehicle marker
    vehicleMarker = L.marker(newLatLng, {
      icon: L.icon({
        iconUrl: isEstimated ? 
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-yellow.png' :
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-blue.png',
        iconSize: [30, 46],
        iconAnchor: [15, 46],
        popupAnchor: [0, -46]
      }),
      title: isEstimated ? 'Estimated Location' : 'Live Location'
    }).addTo(map);
    
    // Add popup
    vehicleMarker.bindPopup(`
      <b>${isEstimated ? '🚨 Estimated Location' : '📍 Live Location'}</b><br>
      Latitude: ${lat.toFixed(4)}<br>
      Longitude: ${lng.toFixed(4)}<br>
      Time: ${new Date().toLocaleTimeString()}<br>
      ${isEstimated ? '<i>Signal lost - Using estimation</i>' : '<i>Good GPS signal</i>'}
    `).openPopup();
  } else {
    // Move existing marker
    vehicleMarker.setLatLng(newLatLng);
    
    // Update icon based on signal status
    vehicleMarker.setIcon(L.icon({
      iconUrl: isEstimated ? 
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-yellow.png' :
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-blue.png',
      iconSize: [30, 46],
      iconAnchor: [15, 46]
    }));
    
    // Update popup
    vehicleMarker.getPopup().setContent(`
      <b>${isEstimated ? '🚨 Estimated Location' : '📍 Live Location'}</b><br>
      Latitude: ${lat.toFixed(4)}<br>
      Longitude: ${lng.toFixed(4)}<br>
      Time: ${new Date().toLocaleTimeString()}<br>
      ${isEstimated ? '<i>Signal lost - Using estimation</i>' : '<i>Good GPS signal</i>'}
    `);
  }
  
  // Center map on vehicle
  map.setView(newLatLng, map.getZoom());
}

// Call initMap when page loads
window.onload = initMap;
