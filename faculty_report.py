import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')

# Define your tables
faculty_table = dynamodb.Table('faculty')
students_table = dynamodb.Table('Students')
attendance_table = dynamodb.Table('attendance')

# Global CORS Headers to prevent browser preflight blocks
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
}

def lambda_handler(event, context):
    # 1. Handle browser preflight OPTIONS request
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "CORS preflight handshake passed"})
        }

    try:
        # 2. Extract facultyID from Path Parameters
        path_parameters = event.get("pathParameters") or {}
        faculty_id = path_parameters.get("facultyID")

        if not faculty_id:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing facultyID path parameter in request URL"})
            }

        # 3. Fetch Faculty Details
        faculty_response = faculty_table.get_item(Key={"faculty ID": faculty_id})
        faculty_item = faculty_response.get("Item")
        
        if not faculty_item:
            return {
                "statusCode": 404,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": f"Faculty member with ID '{faculty_id}' not found"})
            }

        faculty_name = faculty_item.get("name", "Unknown Faculty")
        department = faculty_item.get("department", "N/A")
        subject = faculty_item.get("subject", "")

        if not subject:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "No subject assigned to this faculty member"})
            }

        # 4. Fetch All Students (to build ID-to-Name Map and calculate Total Students)
        students_response = students_table.scan()
        students_items = students_response.get("Items", [])
        
        student_map = {}
        for s in students_items:
            s_id = s.get("studentID")
            if s_id:
                student_map[s_id] = s.get("name", "Unknown Student")

        total_students_registered = len(students_items)

        # 5. Fetch All Attendance Records
        # Note: Scanning is fine for smaller databases. For production, consider querying via a GSI on the subject attribute.
        attendance_response = attendance_table.scan()
        attendance_items = attendance_response.get("Items", [])

        # 6. Filter Attendance Records matching this Faculty's specific Subject
        filtered_attendance = [
            record for record in attendance_items 
            if record.get("subject", "").strip().lower() == subject.strip().lower()
        ]

        # 7. Aggregate attendance metrics per student ID
        # Structure: { student_id: { present: X, total: Y } }
        student_stats = {}
        unique_dates = set()

        for record in filtered_attendance:
            s_id = record.get("studentID") or record.get("rollNumber")
            status = record.get("status")
            date = record.get("date")

            if not s_id:
                continue

            if date:
                unique_dates.add(date)

            if s_id not in student_stats:
                student_stats[s_id] = {"present": 0, "total": 0}

            student_stats[s_id]["total"] += 1
            if status == "Present":
                student_stats[s_id]["present"] += 1

        total_classes_held = len(unique_dates)

        # 8. Format Student List with calculations and separate Low Attendance (<75%)
        student_list = []
        low_attendance_list = []
        overall_percentages_sum = 0
        students_with_attendance_count = 0

        # Distribution counters for Pie Charts (e.g., Above 90%, 75-90%, Below 75%)
        distribution = {
            "above_90": 0,
            "75_to_90": 0,
            "below_75": 0
        }

        # Process each student found in the master Student Map
        for s_id, s_name in student_map.items():
            stats = student_stats.get(s_id, {"present": 0, "total": 0})
            
            s_present = stats["present"]
            s_total = stats["total"]
            
            # If there are classes recorded for this student, calculate percentage
            if s_total > 0:
                pct = round((s_present / s_total) * 100, 2)
            else:
                pct = 0.0

            overall_percentages_sum += pct
            if s_total > 0:
                students_with_attendance_count += 1

            # Determine eligibility status
            status_text = "Eligible" if pct >= 75.0 else "Detained"

            student_data = {
                "rollNo": s_id,
                "name": s_name,
                "attendance": f"{pct}%",
                "attendancePercentage": pct,
                "status": status_text
            }

            student_list.append(student_data)

            # Categorize for charts and low-attendance lists
            if pct < 75.0:
                low_attendance_list.append({
                    "rollNo": s_id,
                    "name": s_name,
                    "attendance": f"{pct}%"
                })
                distribution["below_75"] += 1
            elif pct >= 90.0:
                distribution["above_90"] += 1
            else:
                distribution["75_to_90"] += 1

        # Calculate Average Attendance
        avg_attendance = 0.0
        if students_with_attendance_count > 0:
            avg_attendance = round(overall_percentages_sum / students_with_attendance_count, 2)

        # 9. Return Structured Response
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "facultyName": faculty_name,
                "department": department,
                "subject": subject,
                "totalStudents": total_students_registered,
                "totalClasses": total_classes_held,
                "averageAttendance": f"{avg_attendance}%",
                "averageAttendanceValue": avg_attendance,
                "studentsData": student_list,
                "lowAttendanceStudents": low_attendance_list,
                "chartDistribution": distribution
            })
        }

    except ClientError as e:
        print(f"DynamoDB Client Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": "Database error occurred",
                "details": e.response['Error']['Message']
            })
        }
    except Exception as e:
        print(f"Unexpected Exception: {str(e)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": "Internal server error",
                "details": str(e)
            })
        }