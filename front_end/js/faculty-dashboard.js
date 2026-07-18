// =====================================
// Configuration
// =====================================
const DASHBOARD_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/faculty/dashboard";

// =====================================
// Fetch and Render Dashboard Data
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the logged-in ID (fallback to F001 if session is empty)
    const facultyID = localStorage.getItem("Id") || sessionStorage.getItem("Id") || "";
    const API_URL = `${DASHBOARD_API_URL}/${facultyID}`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch dashboard statistics");
        }
        
        const data = await response.json();

        // Safely extract properties with fallback options
        const name = data.facultyName || data.facultyDetails?.name || "Faculty Member";
        const department = data.facultyDetails?.department || data.department || "Computer Science";
        const subject = data.facultyDetails?.subject || data.subject || "Cloud Computing";

        // Update DOM elements dynamically
        document.getElementById("welcome-name").textContent = name;
        document.getElementById("fac-name").textContent = name;
        document.getElementById("fac-dept").textContent = department;
        document.getElementById("fac-subject").textContent = subject;
        document.getElementById("subject-t").textContent = subject;
        

    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        
        // Offline / Error Fallbacks
       
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