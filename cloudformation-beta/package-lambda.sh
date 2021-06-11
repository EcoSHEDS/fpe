#!/bin/bash
# package api lambda function and upload to S3
# usage: ./package-lambda.sh <api name> <deployment bucket name>

aws cloudformation package --template-file templates/$1/lambda.json --use-json --output-template-file templates/$1/lambda-packaged.json --s3-bucket $2 --s3-prefix lambda-$1
