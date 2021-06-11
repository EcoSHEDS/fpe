# Cloudformation Commands

```sh
export APP_NAME=<app name>
export ENV=<env>
export BUCKET=<bucket name>
export STACK_NAME=${APP_NAME}-${ENV}

# create deployment bucket (must be done in separate stack so nested stacks can be packaged)
./create-deployment.sh ${STACK_NAME} ${BUCKET}

# validate
aws cloudformation validate-template --template-body file://templates/root.json

# package rest lambda function (must be done first to avoid s3-prefix clash)
./package-lambda.sh rest ${BUCKET}

# package root stack (uploads templates to s3)
./package.sh ${BUCKET}
# aws cloudformation package --template-file root.json --use-json --output-template-file root-packaged.json --s3-bucket ${BUCKET} --s3-prefix cloudformation

# create (use packaged template)
./create.sh ${STACK_NAME} parameters.local.json
# aws cloudformation create-stack --stack-name ${STACK_NAME} --template-body file://root-packaged.json --parameters file://root-parameters.json --capabilities CAPABILITY_NAMED_IAM

# update (use packaged template)
./deploy.sh ${STACK_NAME}
# aws cloudformation deploy --stack-name ${STACK_NAME} --template-file root-packaged.json --capabilities CAPABILITY_NAMED_IAM

# delete
./delete.sh ${STACK_NAME}
# aws cloudformation delete-stack --stack-name ${STACK_NAME}

# delete deployment bucket and stack
./delete-deployment.sh ${STACK_NAME} ${BUCKET}

# delete user pool manually
# delete storage bucket manually
aws s3 rb <bucket name>
```
