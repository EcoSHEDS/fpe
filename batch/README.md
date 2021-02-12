
```
docker build -t fpe-batch .
docker run fpe-batch
docker tag fpe-batch 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch

# authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch

# push
docker push 474916309046.dkr.ecr.us-east-1.amazonaws.com/fpe-batch
```
