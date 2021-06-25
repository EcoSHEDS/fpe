#!/bin/bash
# validate template
# usage: ./validate.sh <template name>

TEMPLATE=$1

aws cloudformation validate-template --template-body file://templates/${TEMPLATE}.json
