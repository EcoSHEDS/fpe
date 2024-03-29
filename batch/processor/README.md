# Dependencies

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

# Local Development

Set environmental variables

```sh
source .env.<NODE_ENV>.local
# or (manually)
export REGION=
export DB_SECRET_NAME=
export NOTIFY_TOPIC=
```

Run using node

```sh
node process.js dataset <id>
```

# Build, Run and Deploy

## AWS ECR

### Development

```bash
export APP_NAME=fpe
export ENV=dev
export NAME=${APP_NAME}-${ENV}-batch-processor
export AWS_ACCOUNT=
export AWS_REGION=
export AWS_REPO=${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/${NAME}

# log in
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_REPO}

# build image (turn off VPN!)
docker build -t ${AWS_REPO} .

# build image (Mac M1)
# ref: https://stackoverflow.com/questions/67361936/exec-user-process-caused-exec-format-error-in-aws-fargate-service
docker buildx build --platform=linux/amd64 -t ${AWS_REPO} .

# push to docker hub (turn on VPN!)
docker push ${AWS_REPO}
```

### Production

In production, the docker image must be built and deployed using a Gitlab runner.

The contents of the `./batch` folder must be copied to the USGS GitLab InnerSource repo. The Gitlab runner (created using the AWS Service Catalog) will run the series of commands in the `.gitlab-ci.yml` file, which should build the image and then push it to ECR.

See https://code.chs.usgs.gov/jdwalker1/fpe

## Docker Hub

```bash
export NAME=${APP_NAME}-${ENV}-batch-processor
export DOCKER_USER=
export DOCKER_REPO=${DOCKER_USER}/${NAME}

# log in
docker login -u ${DOCKER_USER}

# build image (turn off VPN!)
docker build -t ${DOCKER_REPO} .

# push to docker hub
docker push ${DOCKER_REPO}
```
