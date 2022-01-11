#!/bin/bash
# deploy root template
# usage: ./deploy.sh

aws cloudformation deploy --stack-name ${STACK_NAME} --template-file templates/root.local.json --capabilities CAPABILITY_NAMED_IAM ${OPT_ROLE_ARN}
