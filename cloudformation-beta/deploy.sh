#!/bin/bash
# deploy root template
# usage: ./deploy.sh <stack name>

aws cloudformation deploy --stack-name $1 --template-file templates/root-packaged.json --capabilities CAPABILITY_NAMED_IAM
