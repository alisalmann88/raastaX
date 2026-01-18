console.log("🚀 add-trip.js loaded successfully");

// Initialize dropdowns
document.addEventListener('DOMContentLoaded', function() {
  console.log("📋 DOM loaded, initializing form...");
  
  // Car brands and models
  const carModels = {
    Toyota: ["Corolla GLi", "Corolla XLi", "Yaris", "Prado", "Hiace"],
    Honda: ["Civic", "Accord", "City", "BR-V"],
    Suzuki: ["Cultus", "Alto", "Wagon R", "Swift"]
  };

  const locations = ["Islamabad", "Rawalpindi", "Gilgit", "Skardu", "Hunza", "Ghakuch", "Astore", "Chilas"];

  // Get elements
  const driverNameInput = document.getElementById("driverName");
  const brandSelect = document.getElementById("carBrand");
  const modelSelect = document.getElementById("carModel");
  const pickupSelect = document.getElementById("pickup");
  const destinationSelect = document.getElementById("destination");
  const dateInput = document.getElementById("trip-date");
  const seatsSelect = document.getElementById("seats");
  const fareInput = document.getElementById("fare");

  // Get logged-in driver - IMPROVED VERSION
  function getLoggedInDriver() {
    console.log("🔍 Checking for logged-in driver...");
    
    // Try multiple sources
    let driver = null;
    
    // 1. Check user object (from auth)
    const user = JSON.parse(localStorage.getItem("user")) || {};
    console.log("User from localStorage:", user);
    
    if (user.role === "driver" && user.name) {
      console.log("✅ Found driver in user object:", user.name);
      return user.name;
    }
    
    // 2. Check dedicated driver object
    const driverObj = JSON.parse(localStorage.getItem("driver")) || {};
    console.log("Driver object from localStorage:", driverObj);
    
    if (driverObj.name) {
      console.log("✅ Found driver in driver object:", driverObj.name);
      return driverObj.name;
    }
    
    // 3. Check if any name exists
    if (user.name) {
      console.log("✅ Using name from user object:", user.name);
      return user.name;
    }
    
    // 4. Check passenger name (fallback)
    const passengerName = localStorage.getItem("passengerName");
    if (passengerName) {
      console.log("⚠️ Using passenger name as fallback:", passengerName);
      return passengerName;
    }
    
    // 5. Last resort - check if we're on driver page
    if (window.location.pathname.includes("driver") || 
        window.location.pathname.includes("add-trip")) {
      console.log("⚠️ On driver page but no driver logged in");
      alert("Please log in as a driver first!");
      window.location.href = "driver-auth.html";
      return "Driver";
    }
    
    console.log("❌ No driver found, using default");
    return "Driver";
  }

  // Initialize dropdowns
  function initializeForm() {
    console.log("🔄 Initializing form elements...");
    
    // Populate car brands
    brandSelect.innerHTML = '<option value="">Select Brand</option>';
    Object.keys(carModels).forEach(brand => {
      brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
    
    // Populate locations
    pickupSelect.innerHTML = '<option value="">Select Pickup</option>';
    destinationSelect.innerHTML = '<option value="">Select Destination</option>';
    locations.forEach(loc => {
      pickupSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
      destinationSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
    });
    
    // Get and set driver name
    const loggedInDriver = getLoggedInDriver();
    console.log("Driver name to use:", loggedInDriver);
    
    if (driverNameInput) {
      driverNameInput.value = loggedInDriver;
      // Make it read-only and show it's auto-filled
      driverNameInput.readOnly = true;
      driverNameInput.style.background = "#f0f0f0";
      driverNameInput.style.color = "#666";
      driverNameInput.title = "Driver name is automatically set from your login";
    }
    
    // Set default values
    brandSelect.value = "Toyota";
    updateCarModels();
    pickupSelect.value = "Islamabad";
    destinationSelect.value = "Gilgit";
    seatsSelect.value = "4";
    fareInput.value = "5000";
    
    // Set date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.valueAsDate = tomorrow;
    dateInput.min = new Date().toISOString().split('T')[0];
    
    console.log("✅ Form initialized for driver:", loggedInDriver);
  }

  // Update car models when brand changes
  function updateCarModels() {
    const brand = brandSelect.value;
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    
    if (brand && carModels[brand]) {
      carModels[brand].forEach(model => {
        modelSelect.innerHTML += `<option value="${model}">${model}</option>`;
      });
      modelSelect.value = carModels[brand][0];
    }
  }

  // Form submission
  document.getElementById("addTripForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    console.log("📤 Form submission started...");
    
    // Get driver name from localStorage
    const loggedInDriver = getLoggedInDriver();
    console.log("Using driver name for trip:", loggedInDriver);
    
    // Collect form data
    const formData = {
      driverName: loggedInDriver, // ✅ This is the key fix
      carModel: modelSelect.value,
      pickup: pickupSelect.value,
      destination: destinationSelect.value,
      date: dateInput.value,
      seats: parseInt(seatsSelect.value),
      fare: parseInt(fareInput.value)
    };
    
    console.log("📝 Form data to send:", formData);
    
    // Validation
    let isValid = true;
    let errorMessage = "";
    
    for (const [key, value] of Object.entries(formData)) {
      if (!value && value !== 0) {
        isValid = false;
        errorMessage = `Please fill in ${key}`;
        break;
      }
    }
    
    if (formData.pickup === formData.destination) {
      isValid = false;
      errorMessage = "Pickup and destination cannot be the same";
    }
    
    if (!isValid) {
      alert("❌ " + errorMessage);
      return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Trip...';
    submitBtn.disabled = true;
    
    try {
      console.log("🌐 Sending request to /api/trips...");
      
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      console.log("📥 Response status:", response.status);
      
      const result = await response.json();
      console.log("📦 Response data:", result);
      
      if (response.ok && result.success) {
        // Show success with driver name
        alert(`✅ Trip added successfully!\nDriver: ${formData.driverName}\nFrom: ${formData.pickup} → ${formData.destination}\nTrip ID: ${result.tripId}\n\nRedirecting to My Trips...`);
        
        // Clear form but keep driver name
        brandSelect.value = "Toyota";
        updateCarModels();
        pickupSelect.value = "Islamabad";
        destinationSelect.value = "Gilgit";
        seatsSelect.value = "4";
        fareInput.value = "5000";
        
        // Set date to tomorrow again
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.valueAsDate = tomorrow;
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = "my-trips.html";
        }, 2000);
        
      } else {
        alert(`❌ Failed to add trip:\n${result.error || result.message || "Unknown error"}`);
      }
      
    } catch (error) {
      console.error("🔥 Fetch error:", error);
      alert(`❌ Network error:\n${error.message}\n\nPlease try again.`);
      
    } finally {
      // Restore button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // Brand change event
  brandSelect.addEventListener('change', updateCarModels);

  // Initialize the form
  initializeForm();
  console.log("🎉 add-trip.js setup complete");
  
  // Debug function - add to window for testing
  window.debugDriver = function() {
    console.log("=== DRIVER DEBUG ===");
    console.log("localStorage user:", JSON.parse(localStorage.getItem("user")));
    console.log("localStorage driver:", JSON.parse(localStorage.getItem("driver")));
    console.log("localStorage drivers:", JSON.parse(localStorage.getItem("drivers")));
    console.log("localStorage passengerName:", localStorage.getItem("passengerName"));
    console.log("Current driver name (from getLoggedInDriver):", getLoggedInDriver());
  };
  
  // Auto-debug on load
  setTimeout(() => {
    window.debugDriver();
  }, 1000);
});
