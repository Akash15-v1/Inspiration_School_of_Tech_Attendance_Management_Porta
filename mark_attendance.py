import json
import boto3
from datetime import datetime, timedelta, timezone

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('attendance')

# Common CORS headers to prevent browser blocks
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
}

def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'CORS preflight handshake successful'})
        }

    try:
        body = json.loads(event.get('body', '{}'))
        studentID = body['studentID']
        subject = body['subject']
        status = body['status']

        # Define India Standard Time timezone (+5:30 offset)
        IST = timezone(timedelta(hours=5, minutes=30))
        
        # Automatically get current date in India Time (DD-MMM-YYYY format)
        current_date = datetime.now(IST).strftime("%Y-%m-%d")

        table.put_item(
            Item={
                'studentID': studentID,
                'date#subject': f"{current_date}#{subject}",
                'date': current_date,
                'subject': subject,
                'status': status
            }
        )

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Attendance Marked Successfully',
                'date': current_date
            })
        }

    except KeyError as e:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': 'Bad Request',
                'details': f'Missing required key: {str(e)}'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': 'Internal Server Error',
                'details': str(e)
            })
        }