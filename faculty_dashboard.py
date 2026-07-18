import json
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')

# Initialize the tables
students_table = dynamodb.Table('Students')
attendance_table = dynamodb.Table('attendance')
faculty_table = dynamodb.Table('faculty')  # <--- Initialize your Faculty table

# Global CORS Headers to prevent browser blocks
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
}

def lambda_handler(event, context):
    # Handle CORS preflight handshake if routed here
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "CORS preflight handshake passed"})
        }

    try:
        # 1. Fetch faculty ID from URL query parameters (e.g., ?facultyID=F001)
        faculty_id= event['pathParameters']['faculyID']

        if not faculty_id:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing 'facultyID' in URL query parameters"})
            }

        # 2. Fetch Faculty Details from DynamoDB
        # We query the primary key 'faculty ID' as named in your table image
        faculty_response = faculty_table.get_item(
            Key={
                "faculty ID": faculty_id
            }
        )

        faculty_item = faculty_response.get("Item")
        if not faculty_item:
            return {
                "statusCode": 404,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": f"Faculty member with ID '{faculty_id}' not found"})
            }

        faculty_name = faculty_item.get("name", "Unknown Faculty")

        # 3. Calculate Today's Attendance Metrics
        today = datetime.now().strftime("%Y-%m-%d")

        # Get total students
        students = students_table.scan()
        total_students = len(students.get("Items", []))

        # Query today's attendance using DateIndex
        attendance = attendance_table.query(
            IndexName="DateIndex",
            KeyConditionExpression=Key("date").eq(today)
        )

        present = 0
        absent = 0
        attendance_items = attendance.get("Items", [])

        for item in attendance_items:
            if item.get("status") == "Present":
                present += 1
            else:
                absent += 1

        marked = len(attendance_items)
        percentage = 0

        if total_students > 0:
            # Simple standard percentage formula
            percentage = round((present / total_students) * 100, 2)

        # 4. Return Dynamic Response with the Real Faculty Name
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "facultyName": faculty_name,            # <--- Now dynamically loaded
                "facultyDetails": faculty_item,          # Optional: returns subject, department, email, etc.
                "date": today,
                "totalStudents": total_students,
                "attendanceMarkedToday": marked,
                "presentToday": present,
                "absentToday": absent,
                "attendancePercentageToday": percentage
            })
        }

    except Exception as e:
        print(f"Exception encountered: {str(e)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": "Internal Server Error",
                "details": str(e)
            })
        }