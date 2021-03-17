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

## Build

```
docker build -t fpe-batch .
docker run fpe-batch
docker tag fpe-batch 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch
```

## Deploy

```
# authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch

# push
docker push 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch
```