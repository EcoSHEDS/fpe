#!/bin/bash
# update auth stack
# usage: ./update-auth.sh

set -eu

aws cloudformation deploy --stack-name ${STACK_NAME}-auth --template-file templates/auth.json
