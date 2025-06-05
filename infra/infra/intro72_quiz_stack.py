from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_s3 as s3,
    aws_iam as iam,
    CfnOutput,
)
from constructs import Construct
from pathlib import Path

class Intro72QuizStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create an S3 bucket to store music files
        bucket = s3.Bucket(
            self, "IntroMusicBucket",
            bucket_name="intro72-quiz",  # Change if this name is already taken globally
            removal_policy=RemovalPolicy.DESTROY,  # Auto-delete the bucket when the stack is destroyed
            auto_delete_objects=True  # Delete all objects when removing the bucket (for development use only)
        )

        # Define a Lambda function
        lambda_fn = _lambda.Function(
            self, "IntroQuizLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset(str(Path(__file__).parent.parent / "../api")),
            environment={
                "BUCKET_NAME": bucket.bucket_name
            },
            timeout=Duration.seconds(10),
        )

        # Grant the Lambda function read access to the S3 bucket
        bucket.grant_read(lambda_fn)

        # Set up API Gateway with a /quiz endpoint connected to the Lambda function
        api = apigw.LambdaRestApi(
            self, "IntroQuizAPI",
            handler=lambda_fn,
            proxy=False,
        )

        quiz = api.root.add_resource("quiz")
        quiz.add_method("GET")

        # Output the public URL for the /quiz endpoint
        CfnOutput(
            self, "APIURL",
            value=api.url + "quiz"
        )
