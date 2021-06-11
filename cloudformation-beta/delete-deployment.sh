#!/bin/bash
# delete deployment stack
# usage: ./delete-deployment.sh <stack name> <bucket name>

aws s3 rm --recursive s3://$2
aws s3 rb s3://$2
aws cloudformation delete-stack --stack-name $1
