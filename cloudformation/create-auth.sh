#!/bin/bash
# create auth stack
# usage: ./create-auth.sh <parameters file>

PARAMETERS_FILE=$1

aws cloudformation create-stack --stack-name ${STACK_NAME}-auth --template-body file://templates/auth.json --parameters file://${PARAMETERS_FILE} --capabilities CAPABILITY_NAMED_IAM ${OPT_ROLE_ARN}
