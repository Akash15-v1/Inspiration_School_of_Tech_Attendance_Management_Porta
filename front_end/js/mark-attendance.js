// =====================================
// Configuration
// =====================================
const DASHBOARD_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/faculty/dashboard";
const STUDENTS_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/students";
const ATTENDANCE_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/attendance";

let facultySubject = ""; // Stores fetched subject globally

// =====================================
// Initialization (Now triggers Auto-Load)
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    const facultyID = localStorage.getItem("Id") || sessionStorage.getItem("Id") || "F001";
    
    try {
        // 1. Fetch Faculty details to dynamically obtain their subject
        const response = await fetch(`${DASHBOARD_API_URL}/${facultyID}`);
        if (!response.ok) throw new Error("Could not retrieve faculty profile.");
        
        const data = await response.json();
        facultySubject = data.facultyDetails?.subject || "Cloud Computing";
        
        // Update the visual display
        document.getElementById("subjectDisplay").value = facultySubject;
    } catch (error) {
        console.error("Error setting up faculty details:", error);
        facultySubject = "Cloud Computing"; // Fallback
        document.getElementById("subjectDisplay").value = facultySubject;
    }

    // 2. Automatically load the student roster on launch[cite: 8]
    await loadStudents();
});

// =====================================
// Load Students List (Runs Automatically)
// =====================================
async function loadStudents() {
    const table = document.getElementById("studentTable");
    table.innerHTML = `<tr><td colspan="3" style="text-align: center;">Fetching live students roster...</td></tr>`;

    try {
        const response = await fetch(STUDENTS_API_URL);
        if (!response.ok) throw new Error("Failed to fetch students database list.");

        const studentsData = await response.json();
        
        // Handle array validation gracefully
        const students = Array.isArray(studentsData) ? studentsData : (studentsData.items || []);
        
        table.innerHTML = "";
        
        if (students.length === 0) {
            table.innerHTML = `<tr><td colspan="3" style="text-align: center;">No students found in the database.</td></tr>`;
            return;
        }

        students.forEach(student => {
            const studentID = student.studentID || student.rollNumber || "N/A";
            const studentName = student.name || "Unknown";

            table.innerHTML += `
            <tr class="student-row" data-id="${studentID}">
                <td>${studentID}</td>
                <td>${studentName}</td>
                <td>
                    <select class="status-select" style="padding: 5px; border-radius: 4px;">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                </td>
            </tr>
            `;
        });

    } catch (error) {
        console.error("Error fetching students list:", error);
        table.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">Failed to load students. Please check backend connection.</td></tr>`;
    }
}

// =====================================
// Submit Attendance Records (POST)
// =====================================
async function submitAttendance() {
    const rows = document.querySelectorAll(".student-row");
    
    if (rows.length === 0) {
        alert("Please load students before submitting attendance.");
        return;
    }

    if (!facultySubject) {
        alert("Subject details are not loaded yet. Try refreshing the page.");
        return;
    }

    const promises = [];

    rows.forEach(row => {
        const studentID = row.getAttribute("data-id");
        const status = row.querySelector(".status-select").value;

        const payload = {
            studentID: studentID,
            subject: facultySubject,
            status: status
        };

        // Fire POST request for each student record to the attendance backend API
        const postPromise = fetch(ATTENDANCE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error(`Submission failed for student ID: ${studentID}`);
            return res.json();
        });

        promises.push(postPromise);
    });

    try {
        // Wait for all HTTP POST calls to successfully complete
        await Promise.all(promises);
        alert("Attendance Submitted and Saved Successfully!");
    } catch (error) {
        console.error("Submission Error:", error);
        alert("Some records failed to submit. Please check your console logs or network status.");
    }
}

// =====================================
// Logout Handler
// =====================================
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}