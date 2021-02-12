Infrastructure for FPE Application
==================================

- Must create fpe-api (API Gateway) after creating lambda function in order to attach invoke permission

```sh
aws cloudformation create-stack --stack-name fpe-auth --template-body file://auth.yml
aws cloudformation create-stack --stack-name fpe-s3-lambda --template-body file://s3-lambda.yml
aws cloudformation create-stack --stack-name fpe-s3-data --template-body file://s3-data.yml
aws cloudformation create-stack --stack-name fpe-rds --template-body file://rds.yml
aws cloudformation create-stack --stack-name fpe-batch --template-body file://batch.yml --capabilities CAPABILITY_NAMED_IAM
aws cloudformation package --template lambda-api-local.yml --s3-bucket walkerenvres-fpe-lambda --s3-prefix api --output-template lambda-api.yml
aws cloudformation create-stack --stack-name fpe-lambda-api --template-body file://lambda-api.yml --capabilities CAPABILITY_NAMED_IAM
aws cloudformation create-stack --stack-name fpe-api --template-body file://api.yml --capabilities CAPABILITY_NAMED_IAM

aws cloudformation deploy --stack-name fpe-rds --template-file rds.yml
aws cloudformation deploy --stack-name fpe-batch --template-file batch.yml --capabilities CAPABILITY_NAMED_IAM
aws cloudformation deploy --stack-name fpe-api --template-file api.yml
aws cloudformation package --template lambda-api-local.yml --s3-bucket walkerenvres-fpe-lambda --s3-prefix api --output-template lambda-api.yml
aws cloudformation deploy --stack-name fpe-lambda-api --template-file lambda-api.yml --capabilities CAPABILITY_NAMED_IAM
```
