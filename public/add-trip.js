// Replace your submit event listener with this:
document.getElementById("addTripForm").addEventListener("submit", async e => {
  e.preventDefault();

  const tripData = {
    driverName: document.getElementById("driverName").value.trim(),
    carModel: document.getElementById("carModel").value,
    pickup: document.getElementById("pickup").value,
    destination: document.getElementById("destination").value,
    date: document.getElementById("trip-date").value,
    seats: parseInt(document.getElementById("seats").value),
    fare: parseInt(document.getElementById("fare").value)
  };

  console.log("📤 Submitting trip data:", tripData);

  try {
    // Try different endpoints
    const apiUrl = "/api/trips"; // Relative URL
    
    console.log("🌐 Calling API:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tripData)
    });

    console.log("📥 Response status:", response.status);
    console.log("📥 Response headers:", response.headers);
    
    const data = await response.json();
    console.log("📦 Response data:", data);

    if (response.ok && data.success) {
      alert("✅ Trip added successfully! Trip ID: " + data.tripId);
      // Reset form
      document.getElementById("addTripForm").reset();
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "my-trips.html";
      }, 2000);
    } else {
      alert("❌ Error: " + (data.error || "Unknown error"));
    }
    
  } catch (error) {
    console.error("🔥 Fetch failed completely:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    // Try alternative URLs
    alert("Connection failed. Trying alternative endpoint...");
    
    // Try with full URL
    try {
      const fullUrl = "https://raastax-production.up.railway.app/api/trips";
      console.log("Trying full URL:", fullUrl);
      
      const response2 = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData)
      });
      
      const data2 = await response2.json();
      console.log("Full URL response:", data2);
      alert("Full URL worked! " + (data2.message || ""));
      
    } catch (error2) {
      console.error("Full URL also failed:", error2);
      alert("Both relative and full URLs failed. Check console for details.");
    }
  }
});
