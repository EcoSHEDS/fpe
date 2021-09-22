#!/bin/bash
# delete s3 bucket and stack
# usage: ./delete-s3.sh <template> <bucket name>

TEMPLATE=$1
BUCKET_NAME=$2

aws s3 rm --recursive s3://${BUCKET_NAME}
aws s3 rb s3://${BUCKET_NAME}
aws cloudformation delete-stack --stack-name ${STACK_NAME}-s3-${TEMPLATE}
