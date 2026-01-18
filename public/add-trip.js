// ===== DATA =====
const carModels = {
  Toyota: ["Corolla GLi", "Corolla XLi", "Yaris", "Prado", "Hiace"],
  Honda: ["Civic", "Accord", "City", "BR-V"],
  Suzuki: ["Cultus", "Alto", "Wagon R", "Swift"]
};

const locations = ["Islamabad", "Rawalpindi", "Gilgit", "Skardu", "Hunza", "Ghakuch", "Astore", "Chilas"];

// ===== ELEMENTS =====
const brandSelect = document.getElementById("carBrand");
const modelSelect = document.getElementById("carModel");
const pickupSelect = document.getElementById("pickup");
const destinationSelect = document.getElementById("destination");
const dateInput = document.getElementById("trip-date");
const seatsInput = document.getElementById("seats");
const fareInput = document.getElementById("fare");
const successMsg = document.getElementById("success-msg");

// ===== INIT DROPDOWNS =====
Object.keys(carModels).forEach(brand => {
  brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
});
locations.forEach(loc => {
  pickupSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
  destinationSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
});

// ===== BRAND → MODEL =====
brandSelect.addEventListener("change", () => {
  modelSelect.innerHTML = `<option value="">Select Model</option>`;
  if (carModels[brandSelect.value]) {
    carModels[brandSelect.value].forEach(m => {
      modelSelect.innerHTML += `<option value="${m}">${m}</option>`;
    });
    modelSelect.value = carModels[brandSelect.value][0];
  }
});

// ===== DEFAULT SELECTIONS =====
brandSelect.value = Object.keys(carModels)[0];
brandSelect.dispatchEvent(new Event("change"));
pickupSelect.value = locations[0];
destinationSelect.value = locations[1];
seatsInput.value = 1;
fareInput.value = 100;
dateInput.valueAsDate = new Date();

// ===== SUBMIT FORM =====
document.getElementById("addTripForm").addEventListener("submit", async e => {
  e.preventDefault();

  const tripData = {
    driverName: "Driver", // You might want to make this an input field
    carModel: modelSelect.value,
    pickup: pickupSelect.value,
    destination: destinationSelect.value,
    date: dateInput.value,
    seats: parseInt(seatsInput.value),
    fare: parseInt(fareInput.value)
  };

  // ===== VALIDATION =====
  for (let key in tripData) {
    if (!tripData[key] && tripData[key] !== 0) {
      alert(`Please fill in "${key}"`);
      return;
    }
  }

  try {
    // ✅ FIXED: Use correct API endpoint
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripData)
    });

    const data = await res.json();

    if (res.ok && data.success) {
      successMsg.style.display = "block";
      setTimeout(() => {
        successMsg.style.display = "none";
        window.location.href = "my-trips.html";
      }, 1500);
    } else {
      alert("Failed to add trip: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Server error: Failed to connect. Check console for details.");
  }
});
