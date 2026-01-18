// raastacare.js - Complete Implementation for RaastaCare Tracking System

// ========== GLOBAL VARIABLES ==========
let map;
let vehicleMarker;
let routeLine;
let checkpointMarkers = [];
let simulationInterval;
let currentTrip = null;
let isDemoActive = false;

// Route coordinates (Gilgit → Islamabad via KKH+Babusar)
const routeCheckpoints = [
  { name: "Gilgit", lat: 35.9208, lng: 74.3144, hasSignal: true, stopType: "start" },
  { name: "Jaglot", lat: 35.7680, lng: 74.2776, hasSignal: false, stopType: "checkpoint" },
  { name: "Chilas", lat: 35.4182, lng: 74.0981, hasSignal: true, stopType: "rest" },
  { name: "Dassu (Lunch Stop)", lat: 35.2600, lng: 73.9800, hasSignal: true, stopType: "lunch" },
  { name: "Babusar Base", lat: 35.0000, lng: 73.8000, hasSignal: false, stopType: "checkpoint" },
  { name: "Babusar Top", lat: 34.8500, lng: 73.6500, hasSignal: false, stopType: "checkpoint" },
  { name: "Naran", lat: 34.9064, lng: 73.6480, hasSignal: true, stopType: "rest" },
  { name: "Islamabad", lat: 33.6844, lng: 73.0479, hasSignal: true, stopType: "destination" }
];

// Segment data for estimation
const routeSegments = [
  { from: 0, to: 1, distance: 45, avgSpeed: 50, avgTime: 54 },
  { from: 1, to: 2, distance: 90, avgSpeed: 40, avgTime: 135 },
  { from: 2, to: 3, distance: 20, avgSpeed: 60, avgTime: 20 },
  { from: 3, to: 4, distance: 60, avgSpeed: 30, avgTime: 120 },
  { from: 4, to: 5, distance: 25, avgSpeed: 20, avgTime: 75 },
  { from: 5, to: 6, distance: 40, avgSpeed: 40, avgTime: 60 },
  { from: 6, to: 7, distance: 250, avgSpeed: 70, avgTime: 214 }
];

// ========== MAP INITIALIZATION ==========
function initMap() {
  // Initialize map centered on Gilgit
  map = L.map('map').setView([35.9208, 74.3144], 9);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);
  
  // Draw route line
  const routeCoords = routeCheckpoints.map(cp => [cp.lat, cp.lng]);
  routeLine = L.polyline(routeCoords, {
    color: '#1f4fd8',
    weight: 4,
    opacity: 0.7,
    dashArray: '10, 5'
  }).addTo(map);
  
  // Add checkpoint markers with custom icons
  routeCheckpoints.forEach((checkpoint, index) => {
    let iconColor;
    switch(checkpoint.stopType) {
      case 'start': iconColor = '#28a745'; break;
      case 'destination': iconColor = '#dc3545'; break;
      case 'lunch': iconColor = '#ffc107'; break;
      default: iconColor = '#6c757d';
    }
    
    const icon = L.divIcon({
      html: `<div style="background: ${iconColor}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${index+1}</div>`,
      className: 'checkpoint-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    const marker = L.marker([checkpoint.lat, checkpoint.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <b>${checkpoint.name}</b><br>
        ${checkpoint.stopType === 'start' ? '🚗 Start Point' : 
          checkpoint.stopType === 'destination' ? '🏁 Destination' :
          checkpoint.stopType === 'lunch' ? '🍽️ Lunch Stop' : '📍 Checkpoint'}<br>
        Signal: ${checkpoint.hasSignal ? '🟢 Good' : '🔴 Weak/None'}
      `);
    
    checkpointMarkers.push(marker);
  });
  
  // Fit map to show entire route
  map.fitBounds(routeLine.getBounds());
  
  console.log("✅ Leaflet map initialized successfully!");
  updateStatus("Map ready. Enter tracking details to begin.");
}

// ========== TRACKING FUNCTIONS ==========
function lookupTrip() {
  const bookingId = document.getElementById('bookingId').value.trim();
  const pinCode = document.getElementById('pinCode').value.trim();
  
  if (!bookingId) {
    showAlert("Please enter a Booking ID or Vehicle Number", "warning");
    return;
  }
  
  // In production, this would fetch from backend
  // For demo, we'll simulate
  updateStatus(`Looking up trip: ${bookingId}...`);
  showLoader(true);
  
  // Simulate API call
  setTimeout(() => {
    startDemoTrip();
    updateStatus(`Trip found! Tracking vehicle ${bookingId}`);
    showLoader(false);
  }, 1000);
}

function startDemoTrip() {
  if (isDemoActive) return;
  
  isDemoActive = true;
  currentTrip = {
    id: 'DEMO-2024-GIL-ISB',
    vehicle: 'GIL-1234',
    driver: 'Ali Khan',
    startTime: new Date(),
    currentSegment: 0,
    position: { ...routeCheckpoints[0] },
    isOnline: true,
    passengers: 12,
    familyContact: '+92 300 1234567'
  };
  
  // Update UI
  document.getElementById('vehicleStatus').innerHTML = '<span class="status-value live">ON ROUTE</span>';
  document.getElementById('vehicleDetail').textContent = `Vehicle ${currentTrip.vehicle} with ${currentTrip.passengers} passengers`;
  document.getElementById('locationText').textContent = routeCheckpoints[0].name;
  document.getElementById('locationDetail').textContent = "Live GPS location";
  document.getElementById('checkpointText').textContent = routeCheckpoints[1].name;
  document.getElementById('checkpointDetail').textContent = "Next: Jaglot";
  document.getElementById('etaText').textContent = "6h 45m";
  document.getElementById('etaDetail').textContent = "To Islamabad";
  
  // Update signal display
  updateSignalDisplay(true);
  
  // Create vehicle marker
  updateVehicleOnMap(currentTrip.position.lat, currentTrip.position.lng, false);
  
  // Start simulation
  simulationInterval = setInterval(simulateTripProgress, 3000);
  
  // Show notification
  showNotification("Trip tracking started! Family has been notified.", "success");
  
  // Simulate sending SMS to family
  simulateFamilyNotification("trip_started");
}

function simulateTripProgress() {
  if (!currentTrip) return;
  
  // Move to next checkpoint after some time
  if (currentTrip.currentSegment < routeCheckpoints.length - 1) {
    const nextSegment = routeSegments[currentTrip.currentSegment];
    const progress = Math.min(1, (Date.now() - currentTrip.startTime) / (nextSegment.avgTime * 60000));
    
    if (progress >= 0.95) {
      // Move to next segment
      currentTrip.currentSegment++;
      if (currentTrip.currentSegment < routeCheckpoints.length) {
        currentTrip.position = { ...routeCheckpoints[currentTrip.currentSegment] };
        
        // Check if this is a special stop
        const checkpoint = routeCheckpoints[currentTrip.currentSegment];
        currentTrip.isOnline = checkpoint.hasSignal;
        
        // Special handling for Dassu (lunch)
        if (checkpoint.stopType === 'lunch') {
          showNotification(`🚗 Lunch break at ${checkpoint.name}! Estimated 30-45 minute stop.`, "info");
          document.getElementById('vehicleStatus').innerHTML = '<span class="status-value estimated">LUNCH BREAK</span>';
          document.getElementById('vehicleDetail').textContent = `Stopped at ${checkpoint.name} for meal`;
          
          // Simulate break time
          setTimeout(() => {
            if (currentTrip) {
              showNotification(`🚗 Resuming journey from ${checkpoint.name}`, "success");
              document.getElementById('vehicleStatus').innerHTML = '<span class="status-value live">ON ROUTE</span>';
            }
          }, 10000); // 10 seconds for demo
        }
        
        // Handle signal loss areas
        if (!checkpoint.hasSignal) {
          simulateFamilyNotification("signal_lost", checkpoint.name);
        }
        
        // Update UI
        document.getElementById('locationText').textContent = checkpoint.name;
        document.getElementById('checkpointText').textContent = 
          currentTrip.currentSegment < routeCheckpoints.length - 1 ? 
          routeCheckpoints[currentTrip.currentSegment + 1].name : "Destination Reached";
        
        // Calculate ETA
        const remainingSegments = routeSegments.slice(currentTrip.currentSegment);
        const totalRemainingTime = remainingSegments.reduce((sum, seg) => sum + seg.avgTime, 0);
        const etaMinutes = Math.round(totalRemainingTime * (1 - progress));
        const etaHours = Math.floor(etaMinutes / 60);
        const etaMins = etaMinutes % 60;
        document.getElementById('etaText').textContent = `${etaHours}h ${etaMins}m`;
        
        // Update map
        updateVehicleOnMap(
          currentTrip.position.lat, 
          currentTrip.position.lng, 
          !currentTrip.isOnline
        );
        
        // Update signal display
        updateSignalDisplay(currentTrip.isOnline);
        
        // If signal lost, show warning
        if (!currentTrip.isOnline) {
          showNotification(`⚠️ Signal lost near ${checkpoint.name}. Using estimated tracking.`, "warning");
        }
      }
    } else {
      // Interpolate position between checkpoints
      const from = routeCheckpoints[currentTrip.currentSegment];
      const to = routeCheckpoints[currentTrip.currentSegment + 1];
      const lat = from.lat + (to.lat - from.lat) * progress;
      const lng = from.lng + (to.lng - from.lng) * progress;
      
      // Update position
      currentTrip.position.lat = lat;
      currentTrip.position.lng = lng;
      
      // Update map
      updateVehicleOnMap(lat, lng, !currentTrip.isOnline);
    }
    
    // Update location detail
    document.getElementById('locationDetail').textContent = 
      currentTrip.isOnline ? "Live GPS location" : "Estimated (Low Signal)";
  } else {
    // Trip completed
    endDemoTrip();
  }
}

function updateVehicleOnMap(lat, lng, isEstimated = false) {
  const latLng = [lat, lng];
  
  if (!vehicleMarker) {
    // Create custom vehicle icon
    const vehicleIcon = L.divIcon({
      html: `
        <div style="background: ${isEstimated ? '#ffc107' : '#1f4fd8'}; 
                    width: 40px; height: 40px; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center;
                    border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                    animation: ${isEstimated ? 'pulse 2s infinite' : 'none'};">
          <i class="fas fa-bus" style="color: white; font-size: 18px;"></i>
        </div>
      `,
      className: 'vehicle-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    vehicleMarker = L.marker(latLng, { icon: vehicleIcon })
      .addTo(map)
      .bindPopup(`
        <b>${isEstimated ? '🚨 Estimated Location' : '📍 Live Location'}</b><br>
        Vehicle: ${currentTrip?.vehicle || 'Unknown'}<br>
        Time: ${new Date().toLocaleTimeString()}<br>
        Status: ${isEstimated ? 'Signal Lost - Estimating' : 'Good Signal'}
      `);
  } else {
    vehicleMarker.setLatLng(latLng);
    
    // Update icon
    const newIcon = L.divIcon({
      html: `
        <div style="background: ${isEstimated ? '#ffc107' : '#1f4fd8'}; 
                    width: 40px; height: 40px; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center;
                    border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                    animation: ${isEstimated ? 'pulse 2s infinite' : 'none'};">
          <i class="fas fa-bus" style="color: white; font-size: 18px;"></i>
        </div>
      `,
      className: 'vehicle-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    vehicleMarker.setIcon(newIcon);
    
    // Update popup
    vehicleMarker.getPopup().setContent(`
      <b>${isEstimated ? '🚨 Estimated Location' : '📍 Live Location'}</b><br>
      Vehicle: ${currentTrip?.vehicle || 'Unknown'}<br>
      Time: ${new Date().toLocaleTimeString()}<br>
      Status: ${isEstimated ? 'Signal Lost - Estimating' : 'Good Signal'}
    `);
  }
  
  // Center map on vehicle if it's near edge
  const bounds = map.getBounds();
  if (!bounds.contains(latLng)) {
    map.setView(latLng, map.getZoom());
  }
}

// ========== DEMO CONTROLS ==========
function simulateSignalLoss() {
  if (!currentTrip) {
    showAlert("Start a demo trip first!", "warning");
    return;
  }
  
  currentTrip.isOnline = false;
  updateSignalDisplay(false);
  showNotification("📶 Simulating signal loss. Switching to estimated tracking...", "warning");
  
  // Simulate family notification
  simulateFamilyNotification("signal_lost", "Simulated Area");
}

function simulateBreak() {
  if (!currentTrip) {
    showAlert("Start a demo trip first!", "warning");
    return;
  }
  
  showNotification("🍽️ Simulating lunch break at Dassu. Vehicle stopped for 30 minutes.", "info");
  document.getElementById('vehicleStatus').innerHTML = '<span class="status-value estimated">LUNCH BREAK</span>';
  document.getElementById('vehicleDetail').textContent = 'Stopped at Dassu for meal';
  
  // Auto-resume after 8 seconds (for demo)
  setTimeout(() => {
    if (currentTrip) {
      showNotification("🚗 Lunch break over. Resuming journey.", "success");
      document.getElementById('vehicleStatus').innerHTML = '<span class="status-value live">ON ROUTE</span>';
    }
  }, 8000);
}

function endDemoTrip() {
  if (!isDemoActive) return;
  
  clearInterval(simulationInterval);
  isDemoActive = false;
  
  // Update UI
  document.getElementById('vehicleStatus').innerHTML = '<span class="status-value live">TRIP COMPLETED</span>';
  document.getElementById('vehicleDetail').textContent = 'Arrived safely at Islamabad';
  document.getElementById('locationText').textContent = 'Islamabad';
  document.getElementById('locationDetail').textContent = 'Destination reached';
  document.getElementById('checkpointText').textContent = '--';
  document.getElementById('checkpointDetail').textContent = 'Journey complete';
  document.getElementById('etaText').textContent = '0h 0m';
  document.getElementById('etaDetail').textContent = 'Arrived';
  
  updateSignalDisplay(false, "Trip Ended");
  showNotification("🎉 Trip completed safely! Family has been notified.", "success");
  
  // Simulate completion notification
  simulateFamilyNotification("trip_completed");
  
  // Reset after delay
  setTimeout(() => {
    resetTracking();
  }, 10000);
}

function resetTracking() {
  clearInterval(simulationInterval);
  isDemoActive = false;
  currentTrip = null;
  
  // Remove vehicle marker
  if (vehicleMarker) {
    map.removeLayer(vehicleMarker);
    vehicleMarker = null;
  }
  
  // Reset UI
  document.getElementById('vehicleStatus').innerHTML = 'Not Tracking';
  document.getElementById('vehicleDetail').textContent = 'Enter tracking details to begin';
  document.getElementById('locationText').textContent = '--';
  document.getElementById('locationDetail').textContent = 'Last known position';
  document.getElementById('checkpointText').textContent = '--';
  document.getElementById('checkpointDetail').textContent = 'Estimated arrival';
  document.getElementById('etaText').textContent = '--';
  document.getElementById('etaDetail').textContent = 'Based on current progress';
  
  updateSignalDisplay(false, "No Active Trip");
  updateStatus("Tracking reset. Enter new tracking details.");
  
  // Clear inputs
  document.getElementById('bookingId').value = '';
  document.getElementById('pinCode').value = '';
}

// ========== UI HELPER FUNCTIONS ==========
function updateStatus(message) {
  const statusEl = document.getElementById('vehicleDetail');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function updateSignalDisplay(isOnline, customMessage = null) {
  const signalDisplay = document.getElementById('signalDisplay');
  if (!signalDisplay) return;
  
  if (customMessage) {
    signalDisplay.innerHTML = `
      <div class="signal-indicator">
        <span class="signal-dot signal-lost"></span>
        <span>${customMessage}</span>
      </div>
    `;
    return;
  }
  
  if (isOnline) {
    signalDisplay.innerHTML = `
      <div class="signal-indicator">
        <span class="signal-dot signal-good"></span>
        <span>🟢 Good Signal</span>
      </div>
    `;
  } else {
    signalDisplay.innerHTML = `
      <div class="signal-indicator">
        <span class="signal-dot signal-lost pulse"></span>
        <span>🔴 No Signal - Estimating</span>
      </div>
    `;
  }
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer;">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#d4edda' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'warning' ? '#856404' : '#0c5460'};
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: 300px;
    max-width: 400px;
    border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#17a2b8'};
    animation: slideIn 0.3s ease;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function showAlert(message, type = "info") {
  alert(message); // Simple alert for now
}

function showLoader(show) {
  const button = document.querySelector('.btn-primary');
  if (show) {
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    button.disabled = true;
  } else {
    button.innerHTML = '<i class="fas fa-search"></i> Track Now';
    button.disabled = false;
  }
}

function simulateFamilyNotification(type, location = "") {
  const messages = {
    trip_started: `🚗 RaastaCare: Trip ${currentTrip?.id || 'DEMO'} has started from Gilgit to Islamabad. Track live: https://raastax.com/track/${currentTrip?.id || 'DEMO'}`,
    signal_lost: `⚠️ RaastaCare: Signal lost near ${location}. Using estimated tracking. Vehicle likely in ${location} area. Next update when signal returns.`,
    trip_completed: `✅ RaastaCare: Trip ${currentTrip?.id || 'DEMO'} completed safely at Islamabad. Thank you for using RaastaCare!`
  };
  
  console.log(`📱 SMS to family (${currentTrip?.familyContact || '+92 300 1234567'}):`);
  console.log(messages[type] || "Notification sent to family");
  
  // In production, this would call your backend to send SMS/email
}

// ========== INITIALIZATION ==========
// Initialize map when page loads
window.onload = function() {
  // Check if map element exists
  if (document.getElementById('map')) {
    initMap();
  }
  
  // Add Enter key support for tracking input
  document.getElementById('bookingId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      lookupTrip();
    }
  });
  
  // Add CSS for pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    .pulse {
      animation: pulse 2s infinite;
    }
  `;
  document.head.appendChild(style);
  
  console.log("RaastaCare initialized successfully!");
};

// ========== EXPORT FUNCTIONS FOR HTML ==========
// Make functions available globally
window.lookupTrip = lookupTrip;
window.startDemoTrip = startDemoTrip;
window.simulateSignalLoss = simulateSignalLoss;
window.simulateBreak = simulateBreak;
window.resetTracking = resetTracking;
