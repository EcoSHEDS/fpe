#!/bin/bash
# create auth stack
# usage: ./create-auth.sh <stack name> <parameters file>

STACK_NAME=$1
PARAMETERS_FILE=$2

aws cloudformation create-stack --stack-name ${STACK_NAME}-auth --template-body file://templates/auth.json --parameters file://${PARAMETERS_FILE} --capabilities CAPABILITY_NAMED_IAM
