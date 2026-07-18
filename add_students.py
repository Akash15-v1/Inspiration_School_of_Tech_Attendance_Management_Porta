import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Students')

# Common CORS headers to resolve browser blocks
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",  # Allows access from any origin
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,OPTIONS"  # Allowed HTTP Methods
}

def lambda_handler(event, context):
    # 1. Handle browser preflight OPTIONS request
    if event.get("httpMethod") == "OPTIONS":
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'CORS preflight handshake successful'})
        }

    try:
        # 2. Fetch records from DynamoDB Students Table
        response = table.scan()
        items = response.get('Items', [])

        # 3. Return response with CORS headers
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps(items)
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