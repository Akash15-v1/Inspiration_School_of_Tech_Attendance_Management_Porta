import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')

students_table = dynamodb.Table('Students')
attendance_table = dynamodb.Table('attendance')

# Global CORS Headers declaration so it applies to ALL returns
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
}

def lambda_handler(event, context):
    try:
        # Check if path parameters exist safely
        if not event.get('pathParameters') or 'studentID' not in event['pathParameters']:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'Missing studentID path parameter'})
            }

        studentID = event['pathParameters']['studentID']

        # Get student details
        student_response = students_table.get_item(
            Key={
                'studentID': studentID
            }
        )

        if 'Item' not in student_response:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,  # Added CORS here
                'body': json.dumps({
                    'message': 'Student not found'
                })
            }

        student = student_response['Item']

        # Get attendance records
        attendance = attendance_table.query(
            KeyConditionExpression=Key('studentID').eq(studentID)
        )

        present = 0
        absent = 0

        for item in attendance.get('Items', []):
            if item.get('status') == "Present":
                present += 1
            else:
                absent += 1

        total = present + absent
        percentage = 0

        if total > 0:
            percentage = round((present / total) * 100, 2)

        # Build dynamic subject data array for standard mapping structures
        subject_report = {}
        for item in attendance.get('Items', []):
            sub = item.get('subject', 'Unknown')
            stat = item.get('status', 'Absent')
            if sub not in subject_report:
                subject_report[sub] = {"present": 0, "absent": 0}
            if stat == "Present":
                subject_report[sub]["present"] += 1
            else:
                subject_report[sub]["absent"] += 1

        subjects_array = []
        for sub_name, metrics in subject_report.items():
            sub_total = metrics["present"] + metrics["absent"]
            sub_pct = round((metrics["present"] / sub_total) * 100) if sub_total > 0 else 0
            subjects_array.append({
                "name": sub_name,
                "attendance": sub_pct
            })

        return {
            'statusCode': 200,
            "headers": CORS_HEADERS,
            'body': json.dumps({
                # Safe checking via .get() prevents KeyError if property is blank in DB
                'name': student.get('name', 'N/A'),
                'roll': student.get('studentID', studentID),
                'rollNumber': student.get('studentID', studentID),
                'department': student.get('branch', ''),  
                'year': str(student.get('year', '')),
                'section': student.get('section', ''),
                'totalClasses': total,
                'presentClasses': present,
                'absentClasses': absent,
                'attendance': percentage,  # Mapped properties for standard dashboard lookups
                'attendancePercentage': percentage,
                'present': present,
                'absent': absent,
                'phone': student.get('phone', ''),  # Returns blank instead of crashing
                'email': student.get('email', ''),  
                'subjects': subjects_array,
                'attendanceHistory': attendance.get('Items', []), 
                'classes': [
                    {"subject": "Cloud Computing", "faculty": "Mrs Bethala Sumana", "time": "09:00 AM"},
                    {"subject": "Java", "faculty": "Mr Juttuka Lovababu", "time": "11:30 AM"}
                ]
            })
        }

    except ClientError as e:
        print(f"DynamoDB ClientError: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Database interaction fault', 'details': str(e)})
        }
    except Exception as e:
        print(f"Generic Runtime Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,  # Added CORS here
            'body': json.dumps({
                'error': str(e)
            })
        }