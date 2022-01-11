#!/bin/bash
# package api lambda function and upload to S3
# usage: ./package-lambda.sh <lambda name>

NAME=$1

aws cloudformation package --template-file templates/lambda-${NAME}.json --use-json --output-template-file templates/lambda-${NAME}.local.json --s3-bucket ${DEPLOYMENT_BUCKET} --s3-prefix lambda-${NAME}
