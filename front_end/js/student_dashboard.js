async function loadDashboard() {
    // 1. Retrieve the email from storage (saved by login.js)
    // This looks in localStorage first; if not found, it checks sessionStorage
    const id = localStorage.getItem("Id") || sessionStorage.getItem("Id");

    // 2. Safety check: if no email exists, the user isn't logged in. Redirect to login.
    if (!id) {
        console.error("No authenticated email found. Redirecting to login.");
        window.location.href = "index.html"; 
        return;
    }

    // Updated URL to pass the email as the identifier parameter
    const url = `https://mwghlvuv82.execute-api.us-east-1.amazonaws.com/dev/student/dashboard/${id}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();

        // 3. Update Text Fields safely using fallback values if data is missing
        document.getElementById('student-name').textContent = data.name || "N/A";
        document.getElementById('welcome-name').textContent = data.name || "Student";
        document.getElementById('roll-number').textContent = data.rollNumber|| "N/A";
        document.getElementById('department').textContent = data.department || "N/A";
        document.getElementById('attendance-percent').textContent = (data.attendancePercentage ?? 0) + '%';

        // 4. Update Classes Table
        const table = document.getElementById('classes-table');
        
        // Clear previous content and set up table headers properly
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Faculty</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody id="classes-table-body"></tbody>
        `;
        
        const tableBody = document.getElementById('classes-table-body');

        // Verify classes array exists before attempting to loop over it
        if (data.classes && Array.isArray(data.classes)) {
            data.classes.forEach(cls => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cls.subject || 'N/A'}</td>
                    <td>${cls.faculty || 'N/A'}</td>
                    <td>${cls.time || 'N/A'}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No classes scheduled for today.</td></tr>`;
        }

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        alert('Failed to load dashboard data. Please try logging in again.');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', loadDashboard);