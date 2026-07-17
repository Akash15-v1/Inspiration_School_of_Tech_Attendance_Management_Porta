// Global placeholder to store live API dataset for exporting later
let reportData = null;

async function loadStudentReport() {
    // 1. Retrieve the studentID stored as "Id" during login context
    const studentID = localStorage.getItem("Id") || sessionStorage.getItem("Id");

    if (!studentID) {
        console.error("No student ID found. Redirecting to login.");
        window.location.href = "index.html";
        return;
    }

    const url = `https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/reports/student/${studentID}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API request for report failed.");

        reportData = await response.json();

        // 2. Load Student Details dynamically into the layout
        document.getElementById("studentName").textContent = reportData.name || "N/A";
        document.getElementById("rollNumber").textContent = reportData.roll || reportData.rollNumber || "N/A";
        document.getElementById("department").textContent = reportData.department || "N/A";
        document.getElementById("overallAttendance").textContent = (reportData.attendance ?? 0) + "%";

        document.getElementById("presentCount").textContent = reportData.present ?? 0;
        document.getElementById("absentCount").textContent = reportData.absent ?? 0;
        
        const subjectsArray = reportData.subjects || [];
        document.getElementById("subjectCount").textContent = subjectsArray.length;

        // 3. Render visual components
        loadTable(subjectsArray);
        loadPieChart(reportData.present ?? 0, reportData.absent ?? 0);
        loadBarChart(subjectsArray);

    } catch (error) {
        console.error("Error loading report:", error);
        alert("Failed to load report data. Please verify your login session.");
    }
}

// ===============================
// Load Table
// ===============================
function loadTable(subjects) {
    const table = document.getElementById("reportTable");
    table.innerHTML = "";

    if (subjects.length === 0) {
        table.innerHTML = `<tr><td colspan="2" style="text-align:center;">No subjects listed.</td></tr>`;
        return;
    }

    subjects.forEach(subject => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${subject.name || "N/A"}</td>
            <td>${subject.attendance ?? 0}%</td>
        `;
        table.appendChild(row);
    });
}

// ===============================
// Pie Chart
// ===============================
function loadPieChart(present, absent) {
    new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels: ["Present", "Absent"],
            datasets: [{
                data: [present, absent],
                backgroundColor: ["#198754", "#dc3545"]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// ===============================
// Bar Chart
// ===============================
function loadBarChart(subjects) {
    new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: subjects.map(x => x.name || "N/A"),
            datasets: [{
                label: "Attendance %",
                data: subjects.map(x => x.attendance ?? 0),
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

// ===============================
// Download PDF
// ===============================
function downloadPDF() {
    alert("PDF download will be connected during backend integration.");
}

// ===============================
// Export CSV
// ===============================
function exportCSV() {
    if (!reportData || !reportData.subjects) {
        alert("No report data available to export yet.");
        return;
    }

    let csv = "Subject,Attendance (%)\n";
    reportData.subjects.forEach(subject => {
        csv += `${subject.name || "Unknown"},${subject.attendance ?? 0}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Student_Report_${reportData.roll || "Extract"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Initialize on execution frame mount
document.addEventListener("DOMContentLoaded", loadStudentReport);