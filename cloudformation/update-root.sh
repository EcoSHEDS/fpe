#!/bin/bash
# update root (does not package lambdas)
# usage: ./update-root.sh <stack name> <deployment bucket>

STACK_NAME=$1
BUCKET=$2

./package.sh ${BUCKET}
./deploy.sh ${STACK_NAME}
