#!/bin/bash

echo packaging...
aws cloudformation package --template lambda-imageset-local.yml --s3-bucket walkerenvres-fpe-lambda --s3-prefix imageset --output-template lambda-imageset.yml

echo deploying...
aws cloudformation deploy --stack-name fpe-lambda-imageset --template-file lambda-imageset.yml --capabilities CAPABILITY_NAMED_IAM
