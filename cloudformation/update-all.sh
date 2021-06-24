#!/bin/bash
# update all templates
# usage: ./update-all.sh <stack name> <deployment bucket>

STACK_NAME=$1
BUCKET=$2

./package-lambda.sh api ${BUCKET}
./package-lambda.sh worker ${BUCKET}
./update-root.sh ${STACK_NAME} ${BUCKET}
