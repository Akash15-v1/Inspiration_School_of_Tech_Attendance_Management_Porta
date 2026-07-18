import json
import boto3

dynamodb = boto3.resource("dynamodb")

users_table = dynamodb.Table("Users")
students_table = dynamodb.Table("Students")
faculty_table = dynamodb.Table("Faculty")

def lambda_handler(event, context):

    try:

        email = event["queryStringParameters"]["email"]

        response = users_table.get_item(
            Key={
                "email": email
            }
        )

        if "Item" not in response:

            return {
                "statusCode":404,
                "body":json.dumps({
                    "message":"User not found"
                })
            }

        user = response["Item"]

        # Student
        if user["role"] == "student":

            student = students_table.get_item(
                Key={
                    "studentID": user["studentID"]
                }
            )

            profile = student["Item"]

            profile["email"] = user["email"]
            profile["role"] = user["role"]

            return {
                "statusCode":200,
                "body":json.dumps(profile)
            }

        # Faculty
        else:

            return {
                "statusCode":200,
                "body":json.dumps({
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"]
                })
            }

    except Exception as e:

        return {
            "statusCode":500,
            "body":json.dumps({
                "error":str(e)
            })
        }