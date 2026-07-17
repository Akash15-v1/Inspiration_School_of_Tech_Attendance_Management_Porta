// =====================================
// Configuration
// =====================================
const PROFILE_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/faculty/dashboard";
const ATTENDANCE_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/attendance";
const STUDENTS_API_URL = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/students"; // <--- Added Students API

// =====================================
// Initialization
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    const facultyID = localStorage.getItem("Id") || sessionStorage.getItem("Id") || "F001";

    try {
        // Step 1: Fetch Faculty Profile to detect assigned subject
        const profileResponse = await fetch(`${PROFILE_API_URL}/${facultyID}`);
        if (!profileResponse.ok) throw new Error("Could not retrieve faculty subject profile.");
        
        const profileData = await profileResponse.json();
        console.log(profileData.facultyDetails?.subject);
        const facultySubject = profileData.facultyDetails?.subject || ""; 

        // Update UI Title with Subject Name
        document.getElementById("table-title").textContent = `Attendance Records: ${facultySubject}`;

        // Step 2: Fetch, Map, and Filter Attendance Data
        await fetchAndDisplayAttendance(facultySubject);

    } catch (error) {
        console.error("Initialization error:", error);
        document.getElementById("table-title").textContent = "Attendance Records (Fallback)";
        
        // Fallback to "Cloud Computing" records if the Profile API fails
        fetchAndDisplayAttendance("Cloud Computing");
    }
});

// =====================================
// Fetch and Display Attendance Records
// =====================================
async function fetchAndDisplayAttendance(targetSubject) {
    const tableBody = document.getElementById("attendanceTable");

    try {
        // 1. Fetch Students and build ID-to-Name Map
        const studentsResponse = await fetch(STUDENTS_API_URL);
        const studentMap = {};

        if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            const studentsArray = Array.isArray(studentsData) ? studentsData : (studentsData.items || []);
            
            // Populate map using studentID as the key
            studentsArray.forEach(student => {
                const id = student.studentID || student.rollNumber;
                if (id) {
                    studentMap[id] = student.name;
                }
            });
        } else {
            console.warn("Failed to fetch students database list. Falling back to inline names.");
        }

        // 2. Fetch Attendance Records
        const response = await fetch(ATTENDANCE_API_URL);
        if (!response.ok) throw new Error("Failed to load records from attendance API.");

        const allRecords = await response.json();
        const recordsArray = Array.isArray(allRecords) ? allRecords : (allRecords.items || []);

        // Filter records by subject
        const filteredRecords = recordsArray.filter(record => 
            record.subject && record.subject.toLowerCase() === targetSubject.toLowerCase()
        );

        // Render with mapped names
        renderTable(filteredRecords, studentMap);

    } catch (error) {
        console.error("API error while retrieving attendance:", error);
        
        // Render fallback with empty map
        renderTable([], {});
    }
}

// =====================================
// DOM Table Renderer Helper
// =====================================
function renderTable(data, studentMap) {
    const tableBody = document.getElementById("attendanceTable");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No attendance records found for this subject.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const rollNum = item.studentID || "N/A";
        
        // Match the ID to our studentMap name database, fallback to item record name or placeholder
        const studentName = studentMap[rollNum] || item.name || "Unknown Student";
        
        const subjectName = item.subject || "N/A";
        const dateStr = item.date || "N/A";
        const statusStr = item.status || "Absent";

        const statusClass = statusStr.toLowerCase() === "present" ? "present" : "absent";

        tableBody.innerHTML += `
            <tr>
                <td>${rollNum}</td>
                <td>${studentName}</td>
                <td>${subjectName}</td>
                <td>${dateStr}</td>
                <td class="${statusClass}">${statusStr}</td>
            </tr>
        `;
    });
}

// =====================================
// Logout Handler
// =====================================
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}