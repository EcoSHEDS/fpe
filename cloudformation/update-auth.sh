#!/bin/bash
# update auth stack
# usage: ./update-auth.sh

set -eu

PARAMETERS_FILE=$1

aws cloudformation deploy --stack-name ${STACK_NAME}-auth --template-file templates/auth.json --parameters file://${PARAMETERS_FILE}
