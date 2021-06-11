#!/bin/bash
# create database stack
# usage: ./create-db.sh <stack name> <parameters file>

aws cloudformation create-stack --stack-name $1-db --template-body file://templates/db.json --parameters file://$2 --capabilities CAPABILITY_NAMED_IAM
