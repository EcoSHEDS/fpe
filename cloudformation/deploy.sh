#!/bin/bash
# deploy root template
# usage: ./deploy.sh <stack name>

STACK_NAME=$1

aws cloudformation deploy --stack-name ${STACK_NAME} --template-file templates/root-packaged.json --capabilities CAPABILITY_NAMED_IAM
