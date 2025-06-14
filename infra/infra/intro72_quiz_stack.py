import os
from aws_cdk import (
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_apigateway as apigateway,
    aws_s3_deployment as s3deploy,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Stack
)

from constructs import Construct
from pathlib import Path

class Intro72QuizStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create an S3 bucket to store music files
        bucket_name = f"intro72-quiz-{self.account}"
        
        bucket = s3.Bucket(
            self, "IntroMusicBucket",
            bucket_name=bucket_name,
            # Use RETAIN policy for production environment
            removal_policy=RemovalPolicy.RETAIN,
            # Don't auto-delete objects in production
            auto_delete_objects=False
        )

        # Define a Lambda function
        lambda_fn = lambda_.Function(
            self, "IntroQuizLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("../api"),
            environment={
                "BUCKET_NAME": bucket.bucket_name,
                "ALLOWED_ORIGIN": os.environ.get("ALLOWED_ORIGIN", "*")
            },
            timeout=Duration.seconds(10),
        )

        # Grant the Lambda function read access to the S3 bucket
        bucket.grant_read(lambda_fn)

        # Set up API Gateway with a /quiz endpoint connected to the Lambda function
        api = apigateway.LambdaRestApi(
            self, "IntroQuizAPI",
            handler=lambda_fn,
            proxy=False,
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=[os.environ.get("ALLOWED_ORIGIN", "*")],
                allow_methods=["GET"]
            )
        )

        quiz = api.root.add_resource("quiz")
        quiz.add_method("GET")

        # Output the public URL for the /quiz endpoint
        CfnOutput(
            self, "APIURL",
            value=api.url + "quiz"
        )
