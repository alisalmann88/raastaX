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

  // Get logged-in user
  function getLoggedInDriver() {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      console.log("Current user from localStorage:", user);
      
      // If user is logged in as driver
      if (user.role === "driver" && (user.name || user.phone)) {
        return user.name || user.phone;
      }
      
      // If driver is logged in via driver-auth
      const driver = JSON.parse(localStorage.getItem("driver")) || {};
      if (driver.name || driver.phone) {
        return driver.name || driver.phone;
      }
      
      // Check if there's any user info
      const passenger = JSON.parse(localStorage.getItem("passengerName"));
      if (passenger) {
        return passenger;
      }
      
      return "Driver"; // Default fallback
    } catch (error) {
      console.error("Error getting user:", error);
      return "Driver";
    }
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
    
    // Set driver name from logged-in user
    const loggedInDriver = getLoggedInDriver();
    console.log("Setting driver name to:", loggedInDriver);
    
    if (driverNameInput) {
      driverNameInput.value = loggedInDriver;
      driverNameInput.readOnly = true; // Make it read-only since we auto-fill it
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
    
    console.log("✅ Form initialized with driver:", loggedInDriver);
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
    
    // Get driver name from localStorage (not from input field)
    const loggedInDriver = getLoggedInDriver();
    
    // Collect form data
    const formData = {
      driverName: loggedInDriver, // ✅ Use logged-in driver name
      carModel: modelSelect.value,
      pickup: pickupSelect.value,
      destination: destinationSelect.value,
      date: dateInput.value,
      seats: parseInt(seatsSelect.value),
      fare: parseInt(fareInput.value)
    };
    
    console.log("📝 Form data (with auto driver name):", formData);
    
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
      console.log("Driver name being sent:", formData.driverName);
      
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
        alert(`✅ Trip added successfully!\nDriver: ${formData.driverName}\nTrip ID: ${result.tripId}\n\nYou will be redirected to My Trips.`);
        
        // Clear form but keep driver name
        brandSelect.value = "";
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        pickupSelect.value = "";
        destinationSelect.value = "";
        seatsSelect.value = "";
        fareInput.value = "";
        
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
      alert(`❌ Network error:\n${error.message}\n\nPlease check console for details.`);
      
      // Try with full URL as fallback
      try {
        console.log("🔄 Trying with full URL...");
        const fullUrl = window.location.origin + '/api/trips';
        const response2 = await fetch(fullUrl, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(formData)
        });
        const result2 = await response2.json();
        console.log("Full URL response:", result2);
        if (result2.success) {
          alert("✅ Trip added via fallback URL!");
        } else {
          alert("Fallback error: " + JSON.stringify(result2));
        }
      } catch (error2) {
        console.error("Fallback also failed:", error2);
      }
      
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
  
  // Debug: log all localStorage items
  console.log("=== LOCALSTORAGE DEBUG ===");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = JSON.parse(localStorage.getItem(key));
      console.log(key + ":", value);
    } catch {
      console.log(key + ":", localStorage.getItem(key));
    }
  }
});
