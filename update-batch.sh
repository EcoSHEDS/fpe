#!/bin/bash
# update batch container

docker build -t fpe-batch ./batch
docker tag fpe-batch 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch
docker push 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch
