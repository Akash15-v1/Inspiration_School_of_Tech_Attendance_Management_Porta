// =====================================
// Configuration
// =====================================
const GET_PROFILE_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/student/dashboard"; 

// =====================================
// Load Profile Data on Startup
// =====================================
window.onload = async function () {
    const studentID = localStorage.getItem("Id") || sessionStorage.getItem("Id");

    if (!studentID) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${GET_PROFILE_URL}/${studentID}`);
        if (!response.ok) throw new Error("Failed to fetch profile records.");
        
        const data = await response.json();

        // All info fields now populate using .textContent instead of .value
        document.getElementById("name").textContent = data.name || "N/A";
        document.getElementById("phone").textContent = data.phone || "N/A";
        document.getElementById("roll").textContent = data.rollNumber || studentID;
        document.getElementById("email").textContent = data.email || "N/A";
        document.getElementById("department").textContent = data.department || "N/A";
        document.getElementById("year").textContent = data.year || "N/A";
        document.getElementById("section").textContent = data.section || "N/A";
        document.getElementById("attendance").textContent = (data.attendance ?? 0) + "%";

    } catch (error) {
        console.warn("Using local fallback display values.", error);
        const fallbackEmail = "rahul@college.com";
        document.getElementById("name").textContent = "Rahul";
        document.getElementById("phone").textContent = "N/A";
        document.getElementById("roll").textContent = studentID;
        document.getElementById("email").textContent = fallbackEmail;
        document.getElementById("department").textContent = "Computer Science Engineering";
        document.getElementById("year").textContent = "2";
        document.getElementById("section").textContent = "A";
        document.getElementById("attendance").textContent = "0%";
    }
};

// =====================================
// Logout Handler
// =====================================
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}