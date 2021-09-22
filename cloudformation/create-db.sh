#!/bin/bash
# create database stack
# usage: ./create-db.sh <parameters file>

PARAMETERS_FILE=$1

aws cloudformation create-stack --stack-name ${STACK_NAME}-db --template-body file://templates/db.json --parameters file://${PARAMETERS_FILE} --capabilities CAPABILITY_NAMED_IAM ${OPT_ROLE_ARN}
