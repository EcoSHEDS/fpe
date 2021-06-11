#!/bin/bash
# create root stack
# usage: ./create.sh <stack name> <parameters file>

aws cloudformation create-stack --stack-name $1 --template-body file://templates/root-packaged.json --parameters file://$2 --capabilities CAPABILITY_NAMED_IAM