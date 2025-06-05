import aws_cdk as core
import aws_cdk.assertions as assertions

from intro72_quiz.intro72_quiz_stack import Intro72QuizStack

# example tests. To run these tests, uncomment this file along with the example
# resource in intro72_quiz/intro72_quiz_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = Intro72QuizStack(app, "intro72-quiz")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
