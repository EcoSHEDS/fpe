#!/bin/bash
# create root stack
# usage: ./create.sh <stack name> <parameters file>

STACK_NAME=$1
PARAMETERS_FILE=$2

aws cloudformation create-stack --stack-name ${STACK_NAME} --template-body file://templates/root-packaged.json --parameters file://${PARAMETERS_FILE} --capabilities CAPABILITY_NAMED_IAM