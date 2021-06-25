#!/bin/bash
# delete root stack
# usage: ./delete.sh <stack name>

STACK_NAME=$1

aws cloudformation delete-stack --stack-name ${STACK_NAME}
