const input = document.querySelector("input");

// Login
document.querySelector(".auth-btn.login").addEventListener("click", () => {
  const phone = input.value.trim();
  if(!phone) return alert("Enter mobile number");

  let users = JSON.parse(localStorage.getItem("drivers")) || [];
  let user = users.find(u => u.phone === phone);

  if(!user) {
    alert("No account found. Please sign up first.");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "driver-dashboard.html";
});

// Sign Up
document.querySelector(".auth-btn.signup").addEventListener("click", () => {
  window.location.href = "driver-signup.html";
});
