#!/bin/bash
# package nested stack templates and upload to S3
# usage: ./package.sh <deployment bucket name>

aws cloudformation package --template-file templates/root.json --use-json --output-template-file templates/root-packaged.json --s3-bucket $1 --s3-prefix cloudformation
