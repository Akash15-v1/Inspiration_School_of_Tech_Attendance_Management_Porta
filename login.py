import json
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

# Define standard CORS headers to reuse across all responses
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
}

def lambda_handler(event, context):
    try:
        # 1. Safely parse the incoming body
        if not event.get('body'):
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "Missing request body"})
            }
            
        body = json.loads(event['body'])
        email = body.get('email')
        password = body.get('password')

        if not email or not password:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "Email and password are required"})
            }

        # 2. Fetch from DynamoDB
        response = table.get_item(Key={'email': email})

        # 3. Check if user exists
        if 'Item' not in response:
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "Invalid email or password"})
            }

        user = response['Item']

        # 4. Check password safely
        if user.get('password') != password:
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "Invalid email or password"})
            }

        # 5. Safely determine ID based on role without risking a KeyError crash
        role = user.get("role", "student")
        if role == "student":
            user_id = user.get("studentID", "N/A")
        else:
            user_id = user.get("facultyID", "N/A")

        # 6. Successful Return
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "message": "Login Successful",
                "role": role,
                "name": user.get("name", "Unknown"),
                "id": user_id
            })
        }

    except ClientError as e:
        # This catches DynamoDB/IAM permission errors instead of letting the Lambda crash
        print(f"DynamoDB Error: {e.response['Error']['Message']}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "Database connection error", "error": str(e)})
        }
    except Exception as e:
        # This catches any other unexpected code exceptions (like JSON parsing issues)
        print(f"Unexpected Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "Internal server code error", "error": str(e)})
        }