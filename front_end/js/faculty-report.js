// =====================================
// Configuration
// =====================================
const BASE_REPORT_API = "https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/fauclty_report";

// Keep track of chart instances so we can destroy them before recreating them
let pieChartInstance = null;
let barChartInstance = null;
let activeStudentsList = []; // Global cache for CSV export

// =====================================
// Load Page on DOM Content Loaded
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the active faculty ID from storage (defaults to "F001")
    const facultyID = localStorage.getItem("Id") || sessionStorage.getItem("Id") || "F001";

    try {
        const response = await fetch(`${BASE_REPORT_API}/${facultyID}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch report data. Status: ${response.status}`);
        }

        const data = await response.json();

        // 1. Render Faculty Details[cite: 10, 11]
        document.getElementById("facultyName").textContent = data.facultyName || "N/A";
        document.getElementById("department").textContent = data.department || "N/A";
        document.getElementById("subject").textContent = data.subject || "N/A";
        document.getElementById("students").textContent = data.totalStudents || "0";

        // 2. Render Summary Cards[cite: 10, 11]
        document.getElementById("totalStudents").textContent = data.totalStudents || "0";
        document.getElementById("totalClasses").textContent = data.totalClasses || "0";
        document.getElementById("averageAttendance").textContent = data.averageAttendance || "0%";

        // Cache student records for global actions (like CSV exports)
        activeStudentsList = data.studentsData || [];

        // 3. Populate Student Attendance Table & Low Attendance List
        loadStudents(activeStudentsList);
        loadLowAttendance(data.lowAttendanceStudents || []);

        // 4. Generate Interactive Visualizations
        loadPieChart(data.chartDistribution || {});
        loadBarChart(activeStudentsList);

    } catch (error) {
        console.error("Error retrieving the Faculty Report:", error);
        alert("Could not load report. Please ensure your API changes are deployed.");
    }
});

// =====================================
// Student Table Renderer[cite: 11]
// =====================================
function loadStudents(students) {
    const table = document.getElementById("studentTable");
    table.innerHTML = "";

    if (students.length === 0) {
        table.innerHTML = `<tr><td colspan="4" style="text-align: center;">No student records registered for this subject.</td></tr>`;
        return;
    }

    students.forEach(student => {
        // Safe mapping to handle lowercase / uppercase properties returned from Lambda
        const rollNo = student.rollNo || student.roll || "N/A";
        const name = student.name || "Unknown";
        const percentage = student.attendancePercentage !== undefined ? student.attendancePercentage : parseFloat(student.attendance);
        const status = student.status || (percentage >= 75 ? "Good" : "Low");

        table.innerHTML += `
        <tr>
            <td>${rollNo}</td>
            <td>${name}</td>
            <td>${percentage}%</td>
            <td>${status}</td>
        </tr>
        `;
    });
}

// =====================================
// Low Attendance List Renderer[cite: 11]
// =====================================
function loadLowAttendance(lowStudents) {
    const list = document.getElementById("lowAttendanceList");
    list.innerHTML = "";

    if (lowStudents.length === 0) {
        list.innerHTML = `<li>🎉 All registered students are above 75% attendance!</li>`;
        return;
    }

    lowStudents.forEach(student => {
        const rollNo = student.rollNo || student.roll || "N/A";
        const name = student.name || "Unknown";
        const attendance = student.attendance || "N/A";

        list.innerHTML += `
        <li>
            ${rollNo} - ${name} (${attendance})
        </li>
        `;
    });
}

// =====================================
// Dynamic Pie Chart Generation[cite: 11]
// =====================================
function loadPieChart(distribution) {
    if (pieChartInstance) pieChartInstance.destroy();

    const goodCount = (distribution.above_90 || 0) + (distribution["75_to_90"] || 0);
    const lowCount = distribution.below_75 || 0;

    const ctx = document.getElementById("pieChart").getContext("2d");
    pieChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Good (≥75%)", "Low (<75%)"],
            datasets: [{
                data: [goodCount, lowCount],
                backgroundColor: [
                    "#198754",
                    "#dc3545"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// =====================================
// Dynamic Bar Chart Generation[cite: 11]
// =====================================
function loadBarChart(students) {
    if (barChartInstance) barChartInstance.destroy();

    const labels = students.map(s => s.name || "Unknown");
    const data = students.map(s => s.attendancePercentage !== undefined ? s.attendancePercentage : parseFloat(s.attendance));

    const ctx = document.getElementById("barChart").getContext("2d");
    barChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Attendance %",
                data: data,
                backgroundColor: "#0d6efd"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// =====================================
// Export CSV Utilities[cite: 11]
// =====================================
function exportCSV() {
    if (activeStudentsList.length === 0) {
        alert("No student data available to export.");
        return;
    }

    let csv = "Roll No,Student,Attendance\n";
    activeStudentsList.forEach(student => {
        const rollNo = student.rollNo || student.roll || "N/A";
        const name = student.name || "Unknown";
        const attendance = student.attendancePercentage !== undefined ? student.attendancePercentage : parseFloat(student.attendance);
        csv += `${rollNo},${name},${attendance}%\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Faculty_Report_Export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// =====================================
// Print to PDF Handler[cite: 11]
// =====================================
function downloadPDF() {
    // Uses the browser's built-in printable style framework
    window.print();
}