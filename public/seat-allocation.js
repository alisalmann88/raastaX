document.addEventListener("DOMContentLoaded", () => {
  const selectedSeatSpan = document.getElementById("selected-seat");
  const totalFareSpan = document.getElementById("total-fare");
  const continueBtn = document.getElementById("continue-btn");
  const availableSeatsSpan = document.getElementById("available-seats");

  // Floating notification helper
  function showNotification(msg) {
    let notif = document.getElementById("notification");
    if (!notif) {
      notif = document.createElement("div");
      notif.id = "notification";
      notif.style.cssText = `
        display:none;
        position:fixed;
        top:20px;
        right:20px;
        background:#ff7a59;
        color:white;
        padding:10px 20px;
        border-radius:6px;
        z-index:1000;
        font-weight:bold;
        box-shadow:0 4px 10px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(notif);
    }
    notif.textContent = msg;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 2000);
  }

  // GET BOOKING DATA
  let bookingData = JSON.parse(localStorage.getItem("bookingData"));
  if (!bookingData) {
    alert("Booking expired");
    window.location.href = "search.html";
  }

  const trip = bookingData.trip;
  const passengers = bookingData.passengers;
  const numPassengers = passengers.length;
  let selectedSeats = [];

  // Seat order for gender check
  const allSeats = ["F1", "B1", "B2", "B3"];

  // MARK ALREADY BOOKED SEATS
  if (trip.bookedSeats?.length) {
    trip.bookedSeats.forEach(s => {
      const seatDiv = document.querySelector(`[data-seat="${s}"]`);
      if (seatDiv) seatDiv.classList.add("occupied");
    });
  }

  // Update available seats
  function updateAvailable() {
    const allSelectable = document.querySelectorAll(".seat:not(.driver-seat)");
    let available = 0;
    allSelectable.forEach(s => {
      if (!s.classList.contains("occupied") && !s.classList.contains("selected")) available++;
    });
    availableSeatsSpan.textContent = available;
  }

  // Gender conflict check (side-by-side)
  function sideBySideGenderConflict(newSeatId) {
    const idx = allSeats.indexOf(newSeatId);
    const newGender = passengers.find(p => !p.seat).gender;
    const neighbors = [allSeats[idx - 1], allSeats[idx + 1]];
    for (let n of neighbors) {
      if (!n) continue;
      if (selectedSeats.includes(n)) {
        const otherGender = passengers.find(p => p.seat === n).gender;
        if (otherGender !== newGender) return true;
      }
    }
    return false;
  }

  // SEAT CLICK HANDLER
  const seats = document.querySelectorAll(".seat");
  seats.forEach(seat => {
    seat.addEventListener("click", () => {
      if (seat.classList.contains("occupied") || seat.classList.contains("driver-seat")) return;

      const seatId = seat.dataset.seat;

      if (selectedSeats.includes(seatId)) {
        // Deselect
        selectedSeats = selectedSeats.filter(s => s !== seatId);
        seat.classList.remove("selected");
        const p = passengers.find(p => p.seat === seatId);
        if (p) p.seat = null;
      } else {
        if (selectedSeats.length >= numPassengers) {
          showNotification(`You can select only ${numPassengers} seat${numPassengers > 1 ? 's' : ''}`);
          return;
        }

        if (sideBySideGenderConflict(seatId)) {
          showNotification("Cannot place male and female side by side");
          return;
        }

        // Select
        selectedSeats.push(seatId);
        seat.classList.add("selected");
        const p = passengers.find(p => !p.seat);
        if (p) p.seat = seatId;
        seat.dataset.gender = p.gender;
      }

      // Update UI
      selectedSeatSpan.textContent = selectedSeats.length ? selectedSeats.join(", ") : "None";

      const totalFare = selectedSeats.reduce((sum, sId) => {
        const s = document.querySelector(`[data-seat="${sId}"]`);
        let price = trip.fare;
        if (s.classList.contains("front-seat")) price *= 1.2;
        return sum + price;
      }, 0);
      totalFareSpan.textContent = "PKR " + totalFare.toLocaleString();

      updateAvailable();
    });
  });

  // CONTINUE BUTTON
  continueBtn.addEventListener("click", async () => {
    if (selectedSeats.length !== numPassengers) {
      showNotification(`Please select ${numPassengers} seat${numPassengers > 1 ? 's' : ''}`);
      return;
    }

    bookingData.seats = selectedSeats;
    bookingData.totalFare = selectedSeats.reduce((sum, sId) => {
      const s = document.querySelector(`[data-seat="${sId}"]`);
      let price = trip.fare;
      if (s.classList.contains("front-seat")) price *= 1.2;
      return sum + price;
    }, 0);

    localStorage.setItem("bookingData", JSON.stringify(bookingData));

    // Send to backend
    try {
      const res = await fetch("http://localhost:3000/book", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          tripId: trip.id,
          seats: selectedSeats,
          passengers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unknown backend error");

      window.location.href = "payment.html";
    } catch(err) {
      showNotification("Error booking seat: " + err.message);
    }
  });

  // Initial available seats
  updateAvailable();
});
