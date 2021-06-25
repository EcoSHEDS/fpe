#!/bin/bash
# create database stack
# usage: ./create-db.sh <stack name> <parameters file>

STACK_NAME=$1
PARAMETERS_FILE=$2

aws cloudformation create-stack --stack-name ${STACK_NAME}-db --template-body file://templates/db.json --parameters file://${PARAMETERS_FILE} --capabilities CAPABILITY_NAMED_IAM
