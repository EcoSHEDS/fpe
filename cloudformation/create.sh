#!/bin/bash
# create root stack
# usage: ./create.sh <parameters file>

PARAMETERS_FILE=$1

aws cloudformation create-stack --stack-name ${STACK_NAME} --template-body file://templates/root-packaged.json --parameters file://${PARAMETERS_FILE} --capabilities CAPABILITY_NAMED_IAM ${OPT_ROLE_ARN}
