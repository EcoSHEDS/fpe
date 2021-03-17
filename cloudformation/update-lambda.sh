#!/bin/bash
# usage: ./update-lambda.sh {api,worker}

echo packaging...
aws cloudformation package --template lambda-$1-local.yml --s3-bucket walkerenvres-fpe-lambda --s3-prefix $1 --output-template lambda-$1.yml

echo deploying...
aws cloudformation deploy --stack-name fpe-lambda-$1 --template-file lambda-$1.yml --capabilities CAPABILITY_NAMED_IAM
