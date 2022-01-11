#!/bin/bash
# package nested stack templates and upload to S3
# usage: ./package.sh

aws cloudformation package --template-file templates/root.json --use-json --output-template-file templates/root.local.json --s3-bucket ${DEPLOYMENT_BUCKET} --s3-prefix cloudformation
