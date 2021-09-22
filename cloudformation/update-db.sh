#!/bin/bash
# update db stack
# usage: ./update-db.sh

set -eu

aws cloudformation deploy --stack-name ${STACK_NAME}-db --template-file templates/db.json
