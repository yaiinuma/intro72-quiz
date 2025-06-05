#!/usr/bin/env python3
import aws_cdk as cdk
from infra.intro72_quiz_stack import Intro72QuizStack

app = cdk.App()
Intro72QuizStack(app, "Intro72QuizStack")
app.synth()
