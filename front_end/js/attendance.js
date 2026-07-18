async function loadAttendanceHistory() {
    // 1. Retrieve the session email from storage
    const id = localStorage.getItem("Id") || sessionStorage.getItem("Id");

    if (!id) {
        console.error("No authenticated session email found. Redirecting to login.");
        window.location.href = "index.html"; 
        return;
    }

    // 2. Fetch the data using the dashboard API endpoint
    const url = `https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/student/dashboard/${id}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        
        // Target the history records array
        const historyRecords = data.attendanceHistory || [];

        // 3. Render records straight into the table
        renderTable(historyRecords);

    } catch (error) {
        console.error('Error fetching attendance history:', error);
        document.getElementById('attendanceTable').innerHTML = `
            <tr><td colspan="3" style="text-align:center; color:red;">Failed to load records. Please refresh.</td></tr>
        `;
    }
}

// Injects the raw history records into the table DOM elements
function renderTable(records) {
    const tableBody = document.getElementById('attendanceTable');
    tableBody.innerHTML = ""; // Clear loader statement

    if (records.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No attendance records found.</td></tr>`;
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        
        // Color code status dynamically (Red for Absent, Green for Present)
        const statusStyle = record.status === 'Absent' ? 'color: red; font-weight: bold;' : 'color: green;';
        
        row.innerHTML = `
            <td>${record.date || 'N/A'}</td>
            <td>${record.subject || 'N/A'}</td>
            <td style="${statusStyle}">${record.status || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadAttendanceHistory);