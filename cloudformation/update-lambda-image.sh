#!/bin/bash

echo packaging...
aws cloudformation package --template lambda-image-local.yml --s3-bucket walkerenvres-fpe-lambda --s3-prefix image --output-template lambda-image.yml

echo deploying...
aws cloudformation deploy --stack-name fpe-lambda-image --template-file lambda-image.yml --capabilities CAPABILITY_NAMED_IAM
