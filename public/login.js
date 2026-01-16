document.getElementById("login-btn").addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;

  if (!name || !role) {
    alert("Fill all fields");
    return;
  }

  const user = {
    name,
    role
  };

  localStorage.setItem("user", JSON.stringify(user));

  // Role-based redirect
  if (role === "passenger") {
    window.location.href = "search.html";
  } else {
    window.location.href = "driver-dashboard.html";
  }
});
