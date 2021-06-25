#!/bin/bash
# delete s3 bucket and stack
# usage: ./delete-s3.sh <template> <stack name> <bucket name>

TEMPLATE=$1
STACK_NAME=$2
BUCKET_NAME=$3

aws s3 rm --recursive s3://${BUCKET_NAME}
aws s3 rb s3://${BUCKET_NAME}
aws cloudformation delete-stack --stack-name ${STACK_NAME}-s3-${TEMPLATE}
