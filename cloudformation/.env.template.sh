#!/bin/bash

export APP_NAME=
export ENV=
export BUCKET_PREFIX=

export STACK_NAME=${APP_NAME}-${ENV}
export DEPLOYMENT_BUCKET=${BUCKET_PREFIX}-${STACK_NAME}-deployment
export STORAGE_BUCKET=${BUCKET_PREFIX}-${STACK_NAME}-storage
export WEBSITE_BUCKET=${BUCKET_PREFIX}-${STACK_NAME}-website
export OPT_ROLE_ARN=""
