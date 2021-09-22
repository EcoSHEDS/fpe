#!/bin/bash
# update subscriptions stack
# usage: ./update-subscriptions.sh

set -eu

aws cloudformation deploy --stack-name ${STACK_NAME}-subscriptions --template-file templates/subscriptions.json
