const bookingData = JSON.parse(localStorage.getItem("bookingData"));
const orderIdSpan = document.getElementById("order-id");

if (!bookingData) {
  alert("Booking expired");
  window.location.href = "search.html";
}

// Fill UI
document.getElementById("passenger-name").textContent = bookingData.fullname || "N/A";
document.getElementById("seat").textContent = bookingData.seats?.join(", ") || "N/A";
document.getElementById("fare").textContent =
  "PKR " + (bookingData.totalFare || 0).toLocaleString();

document.getElementById("pay-btn").addEventListener("click", async () => {
  const method = document.getElementById("payment-method").value;

  if (!method) return alert("Please select a payment method");

  try {
    // Simulate a server call
    await new Promise(res => setTimeout(res, 1000)); // 1 second delay

    // Generate a mock Order ID
    const orderId = "RX" + Date.now();

    // Save paid booking
    const paidBooking = {
      ...bookingData,
      paid: true,
      orderId,
      paymentMethod: method
    };
    localStorage.setItem("paidBooking", JSON.stringify(paidBooking));

    // Show Order ID in UI
    orderIdSpan.textContent = orderId;

    alert("Payment successful! Redirecting to your e-ticket...");

    // Redirect to e-ticket page
    window.location.href = "e-ticket.html";

  } catch (err) {
    alert("Payment failed. Please try again.");
  }
});
