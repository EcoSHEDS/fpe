# Cloudformation Commands

```sh
# load env variables (created from env.template.sh)
source .env.local.sh

# create deployment bucket (must be done in separate stack so nested stacks can be packaged)
./create-s3.sh deployment ${STACK_NAME} ${DEPLOYMENT_BUCKET}

# create storage bucket (must be done in separate stack for chs CI/CD)
./create-s3.sh storage ${STACK_NAME} ${STORAGE_BUCKET}

# create website bucket (must be done in separate stack for chs CI/CD)
./create-s3.sh website ${STACK_NAME} ${WEBSITE_BUCKET}

# create database (kept separate to avoid accidental deletion)
./create-db.sh ${STACK_NAME} parameters/db.local.json

# validate
./validate.sh root

# package lambda functions (must be done first to avoid s3-prefix clash)
./package-lambda.sh api ${DEPLOYMENT_BUCKET}

# package root stack (uploads templates to s3)
./package.sh ${DEPLOYMENT_BUCKET}
# aws cloudformation package --template-file root.json --use-json --output-template-file root-packaged.json --s3-bucket ${DEPLOYMENT_BUCKET} --s3-prefix cloudformation

# create (use packaged template)
./create.sh ${STACK_NAME} parameters/root.local.json
# aws cloudformation create-stack --stack-name ${STACK_NAME} --template-body file://root-packaged.json --parameters/root file://root-parameters/root.json --capabilities CAPABILITY_NAMED_IAM

# update (use packaged template)
./deploy.sh ${STACK_NAME}
# aws cloudformation deploy --stack-name ${STACK_NAME} --template-file root-packaged.json --capabilities CAPABILITY_NAMED_IAM

# repackage and deploy
./update-all.sh ${STACK_NAME} ${DEPLOYMENT_BUCKET}

# delete
./delete.sh ${STACK_NAME}
# aws cloudformation delete-stack --stack-name ${STACK_NAME}

# delete deployment bucket and stack
./delete-s3.sh deployment ${STACK_NAME} ${DEPLOYMENT_BUCKET}

# delete website bucket and stack
./delete-s3.sh website ${STACK_NAME} ${WEBSITE_BUCKET}

# delete storage bucket and stack
./delete-s3.sh storage ${STACK_NAME} ${STORAGE_BUCKET}
```
