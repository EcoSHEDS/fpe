#!/bin/bash
# update root (does not package lambdas)
# usage: ./update-root.sh <stack name> <deployment bucket>

set -eu

STACK_NAME=$1
DEPLOYMENT_BUCKET=$2

./package.sh ${DEPLOYMENT_BUCKET}
./deploy.sh ${STACK_NAME}
