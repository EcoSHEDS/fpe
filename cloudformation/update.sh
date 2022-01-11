#!/bin/bash
# update root (does not package lambdas)
# usage: ./update.sh

set -eu

./package.sh ${DEPLOYMENT_BUCKET}
./deploy.sh ${STACK_NAME}
