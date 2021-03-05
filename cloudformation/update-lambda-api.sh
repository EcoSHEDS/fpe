#!/bin/bash

echo packaging...
aws cloudformation package --template lambda-api-local.yml --s3-bucket walkerenvres-fpe-lambda --s3-prefix api --output-template lambda-api.yml

echo deploying...
aws cloudformation deploy --stack-name fpe-lambda-api --template-file lambda-api.yml --capabilities CAPABILITY_NAMED_IAM
