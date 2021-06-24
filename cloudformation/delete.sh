#!/bin/bash
# delete root stack
# usage: ./delete.sh <stack name>

aws cloudformation delete-stack --stack-name $1
