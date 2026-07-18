// =====================================
// Configuration
// =====================================
const PROFILE_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/faculty/dashboard";

// =====================================
// Load Profile
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    // Get the logged-in ID (fallback to F001 if not set in storage)
    const facultyID = localStorage.getItem("Id") || sessionStorage.getItem("Id") || "F001";

    try {
        const response = await fetch(`${PROFILE_API_URL}/${facultyID}`);
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract faculty details from API response
        const details = data.facultyDetails || {};

        // Update DOM elements dynamically
        document.getElementById("name").textContent = data.facultyName || details.name || "N/A";
        document.getElementById("employeeId").textContent = details["faculty ID"] || facultyID;
        document.getElementById("email").textContent = details.email || "N/A";
        document.getElementById("phone").textContent = details.phone || "N/A";
        document.getElementById("department").textContent = details.department || "N/A";
        document.getElementById("subject").textContent = details.subject || "N/A";

    } catch (error) {
        console.error("Error fetching faculty profile:", error);
        
        // Error / Offline Fallbacks
        document.getElementById("name").textContent = "Dr. Kumar";
        document.getElementById("employeeId").textContent = facultyID;
        document.getElementById("email").textContent = "faculty@gmail.com";
        document.getElementById("phone").textContent = "9876543211";
        document.getElementById("department").textContent = "Computer Science Engineering";
        document.getElementById("subject").textContent = "Cloud Computing";
    }
});

// =====================================
// Logout Session Handler
// =====================================
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}