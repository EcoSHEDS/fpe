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

## Dependencies

If deploying to lambda, dependencies must be pre-installed, which means they need to run on linux. If deploying to batch, then dependencies get installed as part of docker build process.

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

Using AWS EC

```bash
export NAME=fpe-beta-dev-batch
export AWS_ACCOUNT=474916309046
export AWS_REGION=us-east-1
export AWS_REPO=${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/${NAME}

# build image (turn off VPN!)
docker build -t ${NAME} .

# log in
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_REPO}

# tag image with remote name
docker tag ${NAME} ${AWS_REPO}

# push to docker hub
docker push ${AWS_REPO}
```

Using docker hub

```bash
export NAME=fpe-beta-dev-batch
export DOCKER_USER=walkerenvres
export DOCKER_REPO=${DOCKER_USER}/${NAME}

# build image (turn off VPN!)
docker build -t ${NAME} .

# log in
docker login -u ${DOCKER_USER}

# tag image with remote name
docker tag ${NAME} ${DOCKER_REPO}

# push to docker hub
docker push ${DOCKER_REPO}
```
