document.addEventListener("DOMContentLoaded", () => {
  const selectedSeatSpan = document.getElementById("selected-seat");
  const totalFareSpan = document.getElementById("total-fare");
  const continueBtn = document.getElementById("continue-btn");
  const availableSeatsSpan = document.getElementById("available-seats");

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
          alert(`You can select only ${numPassengers} seat${numPassengers > 1 ? 's' : ''}`);
          return;
        }

        // Select
        selectedSeats.push(seatId);
        seat.classList.add("selected");
        const p = passengers.find(p => !p.seat);
        if (p) p.seat = seatId;
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

  // CONTINUE BUTTON - FIXED API CALL
  continueBtn.addEventListener("click", async () => {
    if (selectedSeats.length !== numPassengers) {
      alert(`Please select ${numPassengers} seat${numPassengers > 1 ? 's' : ''}`);
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

    // ✅ FIXED: Changed from localhost:3000 to /api/book
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          tripId: trip.id,
          seats: selectedSeats,
          passengerName: passengers[0]?.name || "Passenger"
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        window.location.href = "payment.html";
      } else {
        alert("Error booking seat: " + (data.error || "Unknown error"));
      }
    } catch(err) {
      console.error("Booking error:", err);
      
      // Try fallback URL
      try {
        const fallbackRes = await fetch("https://raastax-production.up.railway.app/api/book", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            tripId: trip.id,
            seats: selectedSeats,
            passengerName: passengers[0]?.name || "Passenger"
          })
        });
        
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.success) {
          window.location.href = "payment.html";
        } else {
          alert("Fallback error: " + (fallbackData.error || "Unknown error"));
        }
      } catch (fallbackErr) {
        alert("Network error. Please check your connection.");
      }
    }
  });

  // Initial available seats
  updateAvailable();
});
