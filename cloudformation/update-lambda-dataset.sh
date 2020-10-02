#!/bin/bash

echo packaging...
aws cloudformation package --template lambda-dataset-local.yml --s3-bucket walkerenvres-fpe-lambda --output-template lambda-dataset.yml

echo deploying...
aws cloudformation deploy --stack-name fpe-lambda-dataset --template-file lambda-dataset.yml --capabilities CAPABILITY_NAMED_IAM
