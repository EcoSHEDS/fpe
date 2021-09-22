#!/bin/bash
# delete root stack
# usage: ./delete.sh

aws cloudformation delete-stack --stack-name ${STACK_NAME}
