#!/bin/bash
# update auth stack
# usage: ./update-auth.sh <stack name>

set -eu

STACK_NAME=$1

aws cloudformation deploy --stack-name ${STACK_NAME}-auth --template-file templates/auth.json
