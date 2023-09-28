#!/bin/bash
# update all templates
# usage: ./update-all.sh

set -eu

./package-lambda.sh api
./package-lambda.sh trigger
./package-lambda.sh worker
./package-lambda.sh models
./package-lambda.sh email
./update.sh
