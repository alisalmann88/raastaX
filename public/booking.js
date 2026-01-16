// GET TRIP FROM LOCALSTORAGE
const stored = JSON.parse(localStorage.getItem("bookingData"));
if (!stored || !stored.trip) {
  alert("No trip selected");
  window.location.href = "search.html";
}
const trip = stored.trip;

// DOM ELEMENTS
const numPassengersInput = document.getElementById("num-passengers");
const passengerListDiv = document.getElementById("passenger-list");
const paymentSelect = document.getElementById("payment");
const continueBtn = document.getElementById("continue-btn");

// TRIP SUMMARY
document.querySelector(".trip-summary").innerHTML = `
  <h3>Trip Summary</h3>
  <p><strong>Route:</strong> ${trip.pickup} → ${trip.destination}</p>
  <p><strong>Date:</strong> ${new Date(trip.date).toLocaleDateString()}</p>
  <p><strong>Fare per seat:</strong> PKR ${trip.fare}</p>
`;

// GENERATE PASSENGER FIELDS
function generatePassengerFields() {
  const num = Number(numPassengersInput.value);
  passengerListDiv.innerHTML = "";

  // If 4 passengers, only one full car booking
  const passengerCount = num === 4 ? 1 : num;

  for (let i = 1; i <= passengerCount; i++) {
    passengerListDiv.innerHTML += `
      <div class="passenger-info">
        <h4>Passenger ${i}</h4>
        <label>Name</label>
        <input type="text" class="pass-name" placeholder="Full Name" required>
        <label>Gender</label>
        <select class="pass-gender">
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
        <label>DOB</label>
        <input type="date" class="pass-dob" required>
        <label>CNIC</label>
        <input type="text" class="pass-cnic" placeholder="e.g. 42101-1234567-8" required>
        <label>Email</label>
        <input type="email" class="pass-email" placeholder="email@example.com" required>
        <label>Phone</label>
        <input type="tel" class="pass-phone" placeholder="03XXXXXXXXX" required>
      </div>
    `;
  }
}

// INITIAL GENERATE
generatePassengerFields();

// CHANGE EVENT
numPassengersInput.addEventListener("change", generatePassengerFields);

// CONTINUE
continueBtn.addEventListener("click", () => {
  const names = [...document.querySelectorAll(".pass-name")].map(i => i.value.trim());
  const genders = [...document.querySelectorAll(".pass-gender")].map(i => i.value);
  const dobs = [...document.querySelectorAll(".pass-dob")].map(i => i.value);
  const cnics = [...document.querySelectorAll(".pass-cnic")].map(i => i.value.trim());
  const emails = [...document.querySelectorAll(".pass-email")].map(i => i.value.trim());
  const phones = [...document.querySelectorAll(".pass-phone")].map(i => i.value.trim());

  // Validate
  if (names.some(n=>!n) || dobs.some(d=>!d) || cnics.some(c=>!c) || emails.some(e=>!e) || phones.some(p=>!p)) {
    alert("Please fill all passenger details");
    return;
  }

  const passengers = names.map((name,i)=>({
    name,
    gender:genders[i],
    dob:dobs[i],
    cnic:cnics[i],
    email:emails[i],
    phone:phones[i],
    seat:null
  }));

  // Save bookingData
  const bookingData = {
    trip,
    passengers,
    payment: paymentSelect.value,
    seats: [],
    totalFare: trip.fare * passengers.length
  };

  localStorage.setItem("bookingData", JSON.stringify(bookingData));
  window.location.href = "seat-allocation.html";
});
