import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
attendance_table = dynamodb.Table('attendance')

# Centralized CORS Header policy mapping
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
}

def lambda_handler(event, context):
    try:
        # Secure the path identifier parameter
        if not event.get("pathParameters") or "studentID" not in event["pathParameters"]:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "Missing studentID path parameter"})
            }

        studentID = event["pathParameters"]["studentID"]

        # Database Query Operations
        response = attendance_table.query(
            KeyConditionExpression=Key("studentID").eq(studentID)
        )
        items = response.get("Items", [])

        if len(items) == 0:
            return {
                "statusCode": 404,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "No attendance records found"})
            }

        total_present = 0
        total_absent = 0
        subject_report = {}

        # Parsing raw metrics 
        for item in items:
            subject = item.get("subject", "Unknown")
            status = item.get("status", "Absent")

            if subject not in subject_report:
                subject_report[subject] = {"present": 0, "absent": 0}

            if status == "Present":
                total_present += 1
                subject_report[subject]["present"] += 1
            else:
                total_absent += 1
                subject_report[subject]["absent"] += 1

        total_classes = total_present + total_absent
        overall_percentage = 0
        if total_classes > 0:
            overall_percentage = round((total_present / total_classes) * 100)

        subjects = []
        for subject_name, data in subject_report.items():
            subject_total = data["present"] + data["absent"]
            percentage = 0
            if subject_total > 0:
                percentage = round((data["present"] / subject_total) * 100)

            # Match frontend object definition field properties ('name', 'attendance')
            subjects.append({
                "name": subject_name,
                "attendance": percentage
            })

        # Final structural delivery payload formatting mapped to front-end architecture
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "name": f"Student {studentID}",  # Fallback until Profile table joins are added
                "roll": studentID,
                "department": "Computer Science Engineering", 
                "attendance": overall_percentage,
                "present": total_present,
                "absent": total_absent,
                "subjects": subjects
            })
        }

    except ClientError as e:
        print(f"DynamoDB Error: {e.response['Error']['Message']}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "Database connection error", "error": str(e)})
        }
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "Internal server code error", "error": str(e)})
        }