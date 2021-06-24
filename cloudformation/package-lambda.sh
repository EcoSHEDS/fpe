#!/bin/bash
# package api lambda function and upload to S3
# usage: ./package-lambda.sh <lambda name> <deployment bucket name>

aws cloudformation package --template-file templates/lambda-$1.json --use-json --output-template-file templates/lambda-$1-packaged.json --s3-bucket $2 --s3-prefix lambda-$1
