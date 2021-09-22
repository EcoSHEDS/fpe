#!/bin/bash
# Create SNS subscriptions
# usage: ./create-subscriptions.sh <parameters file>

PARAMETERS_FILE=$1

aws cloudformation create-stack --stack-name ${STACK_NAME}-subscriptions --template-body file://templates/subscriptions.json --parameters file://${PARAMETERS_FILE} --capabilities CAPABILITY_NAMED_IAM ${OPT_ROLE_ARN}
