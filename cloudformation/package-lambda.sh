#!/bin/bash
# package api lambda function and upload to S3
# usage: ./package-lambda.sh <lambda name> <deployment bucket name>

NAME=$1
DEPLOYMENT_BUCKET=$2

aws cloudformation package --template-file templates/lambda-${NAME}.json --use-json --output-template-file templates/lambda-${NAME}-packaged.json --s3-bucket ${DEPLOYMENT_BUCKET} --s3-prefix lambda-${NAME}
