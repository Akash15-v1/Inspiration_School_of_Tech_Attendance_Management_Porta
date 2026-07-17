// =========================================
// Check Existing Login
// =========================================


// =========================================
// Login
// =========================================

const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");
    const remember = document.getElementById("rememberMe").checked;

    message.innerHTML = "";
    message.style.color = ""; // Reset color status

    // Storage Selection
    let storage = remember ? localStorage : sessionStorage;

    try {
        const response = await fetch("https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/Login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        // FIX 1: Explicitly stop execution if the response status is not 2xx
        if (!response.ok) {
            throw new Error("Invalid Email or Password");
        }

        const data = await response.json();

        // FIX 2: Clear old session data ONLY after verifying a successful login
        localStorage.clear();
        sessionStorage.clear();

        // Save incoming user data
        storage.setItem("role", data.role || "");
        storage.setItem("name", data.name || "");
        storage.setItem("email", data.email || "");
        storage.setItem("Id",data.id||0);

        // Redirect based on role mappings
        if (data.role === "student") {
            window.location.href = "student-dashboard.html";
        } else if (data.role === "faculty") {
            window.location.href = "faculty-dashboard.html";
        } else {
            message.style.color = "red";
            message.innerHTML = "Access Denied: Unknown user role.";
            console.log("Unknown role payload:", data);
        }

    } catch (err) {
        // Displays exact message thrown or a default error fallback
        message.style.color = "red";
        message.innerHTML = err.message || "An unexpected error occurred. Please try again.";
    }
});