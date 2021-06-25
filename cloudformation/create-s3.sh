#!/bin/bash
# Create s3 bucket
# usage: ./create-s3.sh <template> <stack name> <bucket name>

TEMPLATE=$1
STACK_NAME=$2
BUCKET_NAME=$3

aws cloudformation create-stack --stack-name ${STACK_NAME}-s3-${TEMPLATE} --template-body file://templates/s3-${TEMPLATE}.json --parameters ParameterKey=bucketName,ParameterValue=${BUCKET_NAME}
