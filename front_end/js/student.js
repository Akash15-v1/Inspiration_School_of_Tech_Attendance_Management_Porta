// ================================
// Student Dashboard
// ================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Student Dashboard Loaded");

    loadStudentDetails();
    loadTodaysClasses();
    loadRecentAttendance();
    loadNotifications();

});

// ================================
// Student Details
// ================================

function loadStudentDetails() {

    const student = {

        name: "Satwika",
        rollNo: "22CSE001",
        department: "Computer Science Engineering",
        attendance: "92%"

    };

    const cards = document.querySelectorAll(".card");

    cards[0].querySelector("p").textContent = student.name;
    cards[1].querySelector("p").textContent = student.rollNo;
    cards[2].querySelector("p").textContent = student.department;
    cards[3].querySelector("p").textContent = student.attendance;

}
function viewReports(){

    window.location.href="student-report.html";

}
// ================================
// Today's Classes
// ================================

function loadTodaysClasses() {

    console.log("Today's classes loaded.");

    // Later:
    // GET /student/dashboard

}

// ================================
// Recent Attendance
// ================================

function loadRecentAttendance() {

    console.log("Recent attendance loaded.");

    // Later:
    // GET /attendance/student/{studentId}

}

// ================================
// Notifications
// ================================

function loadNotifications() {

    console.log("Notifications loaded.");

    // Later:
    // GET /notifications

}

// ================================
// Logout
// ================================

function logout() {

    if (confirm("Are you sure you want to logout?")) {

        localStorage.removeItem("token");

        window.location.href = "login.html";

    }

}