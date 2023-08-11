# Cloudformation Commands

```sh
# load env variables (created from env.template.sh)
source .env.dev.local.sh
source .env.prod.local.sh

# create deployment bucket (must be done in separate stack so nested stacks can be packaged)
./create-s3.sh deployment ${DEPLOYMENT_BUCKET}

# create storage bucket (must be done in separate stack for chs CI/CD)
./create-s3.sh storage ${STORAGE_BUCKET}

# create website bucket (must be done in separate stack for chs CI/CD)
./create-s3.sh website ${WEBSITE_BUCKET}

# create deployment bucket (must be done in separate stack so nested stacks can be packaged)
./create-s3.sh models ${MODELS_BUCKET}

# create database (kept separate to avoid accidental deletion)
./create-db.sh parameters/db.${ENV}.local.json

# create auth (kept separate to avoid accidental deletion)
./create-auth.sh parameters/auth.${ENV}.local.json

# validate
./validate.sh root

# package lambda functions (must be done first to avoid s3-prefix clash)
./package-lambda.sh api
./package-lambda.sh trigger
./package-lambda.sh worker

# package root stack (uploads templates to s3)
./package.sh
# aws cloudformation package --template-file root.json --use-json --output-template-file root-packaged.json --s3-bucket ${DEPLOYMENT_BUCKET} --s3-prefix cloudformation

# create (use packaged template)
./create.sh parameters/root.${ENV}.local.json
# aws cloudformation create-stack --stack-name ${STACK_NAME} --template-body file://root.local.json --parameters file://root-parameters/root.json --capabilities CAPABILITY_NAMED_IAM

# create SNS subscriptions
cp templates/subscriptions.template.json templates/subscriptions.${ENV}.local.json
# edit templates/subscriptions.${ENV}.local.json
./create-subscriptions.sh parameters/subscriptions.${ENV}.local.json

# add trigger to auth
aws cloudformation deploy --stack-name ${STACK_NAME}-auth --template-file templates/auth.json --capabilities CAPABILITY_NAMED_IAM --parameter-overrides lambdaTriggerArn=arn:aws:lambda:us-east-1:474916309046:function:${APP_NAME}-${ENV}-lambda-trigger

# update (use packaged template)
./deploy.sh
# aws cloudformation deploy --stack-name ${STACK_NAME} --template-file root.dev.local.json --capabilities CAPABILITY_NAMED_IAM

# repackage and deploy
./update-all.sh

# repackage and deploy root only (no lambdas)
./update.sh

# delete
./delete.sh
# aws cloudformation delete-stack --stack-name ${STACK_NAME}

# delete deployment bucket and stack
./delete-s3.sh deployment ${DEPLOYMENT_BUCKET}

# delete website bucket and stack
./delete-s3.sh website ${WEBSITE_BUCKET}

# delete storage bucket and stack
./delete-s3.sh storage ${STORAGE_BUCKET}
```

## Roles

Get current role

```
$ aws sts get-caller-identity
{
    "UserId": "AROA2DHXFQAOUGWJCLMNY:jdwalker@contractor.usgs.gov",
    "Account": "694155575325",
    "Arn": "arn:aws:sts::694155575325:assumed-role/adfs-developers/jdwalker@contractor.usgs.gov"
}
```

Assume `csr-cloudformation` role

```
$ aws sts assume-role --role-arn "arn:aws:iam::694155575325:role/csr-CloudFormation" --role-session-name AWSCLI-Session
```
