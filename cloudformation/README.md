Cloudformation Instructions
===========================

For production, include IAM role `csr-CloudFormation` for all `create-stack` commands.

```
export IAM_ROLE="--role-arn arn:aws:iam::694155575325:role/csr-CloudFormation"
```

Otherwise

```
export IAM_ROLE=""
```

## General Commands

Validate a template

```
aws cloudformation validate-template --template-body file://rds.yml
```

Create a new stack

```
aws cloudformation create-stack --stack-name fpe-rds --template-body file://rds.yml
```

Delete a stack

```
aws cloudformation delete-stack --stack-name fpe-rds
```


Update an existing stack

```
aws cloudformation update-stack --stack-name fpe-rds --template-body file://rds.yml
```


## RDS

```
aws cloudformation create-stack --stack-name fpe-rds --template-body file://rds.yml
```

## S3 Buckets

```
aws cloudformation create-stack --stack-name fpe-s3-storage --template-body file://s3-storage.yml --parameters file://params/s3-storage.json $IAM_ROLE

aws cloudformation create-stack --stack-name fpe-s3-lambda --template-body file://s3-lambda.yml --parameters file://params/s3-lambda.json $IAM_ROLE
```

## Lambda

Lambda templates must be packaged before being created.

```
aws cloudformation package --template lambda-dataset-local.yml --s3-bucket walkerenvres-fpe-lambda --s3-prefix dataset --output-template lambda-dataset.yml
```

For CHS, uncomment `PermissionsBoundary` for the `LambdaExecutionRole` in `lambda.yml`.

Create lambda stack

```
aws cloudformation create-stack --stack-name fpe-lambda-dataset --template-body file://lambda-dataset.yml --parameters file://params/lambda-dataset.json --capabilities CAPABILITY_NAMED_IAM $IAM_ROLE
```

Update lambda stack

```
aws cloudformation deploy --stack-name fpe-lambda-dataset --template-file lambda-dataset.yml --capabilities CAPABILITY_NAMED_IAM
```

Invoke lambda function

```
aws lambda invoke --function-name fpe-lambda-dataset --invocation-type Event --payload '{"name": "test"}' response.json
aws lambda invoke --function-name fpe-lambda-dataset --invocation-type Event --payload file://payload.json response.json # payload file
```

## IMPORTANT

Add new lambda security group (lambda-vpc) to ingress rules for rds security group


Lambda needs public internet access to invoke another lambda because AWS api is on the internet
Create VPC with public and private subnets for lambda (https://aws.amazon.com/premiumsupport/knowledge-center/internet-access-lambda-function/)
Also see: add NAT to VPC so lambda can invoke other lambda (https://stackoverflow.com/questions/39144688/aws-lambda-invoke-not-calling-another-lambda-function-node-js)
Create VPC endpoint to access s3 (https://aws.amazon.com/blogs/aws/new-vpc-endpoint-for-amazon-s3/)

RDS must be on public subnets for external access (https://aws.amazon.com/premiumsupport/knowledge-center/rds-connectivity-instance-subnet-vpc/)
