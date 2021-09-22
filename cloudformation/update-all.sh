#!/bin/bash
# update all templates
# usage: ./update-all.sh

set -eu

./package-lambda.sh api ${DEPLOYMENT_BUCKET}
./package-lambda.sh trigger ${DEPLOYMENT_BUCKET}
./package-lambda.sh worker ${DEPLOYMENT_BUCKET}
./update-root.sh ${STACK_NAME} ${DEPLOYMENT_BUCKET}
