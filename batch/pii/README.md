# PII Detector

The PII detector uses [Microsoft MegaDetector](https://github.com/microsoft/CameraTraps) to identify persons and vehicles in images. The detector is run on a batch of images from a single imageset and outputs a JSON file with the results. The `Dockerfile` defines a container that can be run using AWS Batch.

## Build Docker Image

```bash
export APP_NAME=fpe
export ENV=dev
export NAME=${APP_NAME}-${ENV}-batch-pii
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

```sh
docker build -t fpe-batch-pii .
docker run -it --rm -v ~/data/atherton/img:/workspace/img -v data/atherton/out:/workspace/out fpe-pii:latest bash
python lib/cameratraps/detection/run_detector_batch.py model/md_v5a.0.0.pt img/ out/out.json --output_relative_filenames --recursive
```

## Local Testing


## Running MegaDetector Locally

Fetch model files

```sh
./fetch-models.sh
```

Create conda environment from `Microsoft/cameratraps`:

```sh
conda env create --file lib/cameratraps/environment-detector.yml
conda activate cameratraps-detector
pip install sqlalchemy psycopg2
```

Finally, add the submodule repositories to your Python path (whenever you start a new shell).

```sh
export PYTHONPATH="$PYTHONPATH:$(pwd)/lib/cameratraps:$(pwd)/lib/yolov5"
```

Load configuration

```sh
source .env.development.local
```

```sh
python detect-imageset.py
```
