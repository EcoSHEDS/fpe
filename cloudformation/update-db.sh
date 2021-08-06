#!/bin/bash
# update db stack
# usage: ./update-db.sh <stack name>

set -eu

STACK_NAME=$1

aws cloudformation deploy --stack-name ${STACK_NAME}-db --template-file templates/db.json
