# Configurations

## Dataset

```
{
  timestamp: {
    column: 'column name',
    timezone: 'UTC|EDT|EST...'
  },
  value: {
    column: 'column name',
    variable_id: <int>
  }
}
```

# Container

## Dependencies (Lambda Only?)

For image processing, the `sharp` library must be compiled for linux (see [Installation for AWS Lambda](https://sharp.pixelplumbing.com/install#aws-lambda))

```
# on windows, use docker
rm -rf node_modules/sharp
docker run -v "%cd%":/var/task lambci/lambda:build-nodejs12.x npm install sharp # windows
docker run -v "$PWD$":/var/task lambci/lambda:build-nodejs12.x npm install sharp # unix

# on mac
rm -rf node_modules/sharp
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=x64 --platform=linux sharp
```

## Build, Run and Deploy

```bash
export REGION=<aws region>
export ACCOUNT=<aws account number>
export REPO=<repo name>
export DB_SECRET_NAME=<db secret name>

docker build -t ${REPO} .
docker run ${REPO}
docker tag ${REPO} ${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${REPO}

# run (fails due to missing AWS credentials)
docker run -e "DB_SECRET_NAME=${DB_SECRET_NAME}" -e "REGION=${REGION}" ${REPO} node process.js dataset 1

# authenticate
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${REPO}

# push
docker push ${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${REPO}
```
