#!/bin/bash
# Create deployment bucket
# usage: ./create-deployment.sh <stack name> <bucket name>

aws cloudformation create-stack --stack-name $1-deployment --template-body file://templates/deployment.json --parameters ParameterKey=bucketName,ParameterValue=$2
