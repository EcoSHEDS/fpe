#!/bin/bash
# Terminate an AWS Batch job using the fpe batch job role.
# usage: ./terminate-job.sh <job_id> [reason]
# example:
#   ./terminate-job.sh 12345678-1234-1234-1234-123456789012
#   ./terminate-job.sh 12345678-1234-1234-1234-123456789012 "Stopping duplicate predict job"

# Instead of set -e, we'll handle errors manually

# Check for jq dependency
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq first."
    echo "  macOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  Amazon Linux: sudo yum install jq"
    exit 1
fi

# Check for aws dependency
if ! command -v aws &> /dev/null; then
    echo "Error: aws CLI is required but not installed. Please install and configure aws first."
    exit 1
fi

usage() {
    echo "Usage: ./terminate-job.sh <job_id> [reason]"
    echo "Example:"
    echo "  ./terminate-job.sh 12345678-1234-1234-1234-123456789012"
    echo "  ./terminate-job.sh 12345678-1234-1234-1234-123456789012 \"Stopping duplicate predict job\""
}

if [ $# -eq 1 ] && { [ "$1" = "-h" ] || [ "$1" = "--help" ]; }; then
    usage
    exit 0
fi

if [ $# -lt 1 ]; then
    echo "Error: Expected a job ID and optional reason"
    usage
    exit 1
fi

JOB_ID="$1"
shift
REASON="${*:-Terminated by scripts/terminate-job.sh}"

if [ -z "$JOB_ID" ]; then
    echo "Error: Missing job ID"
    usage
    exit 1
fi

echo "Configuration:"
echo "  Job ID: ${JOB_ID}"
echo "  Reason: ${REASON}"

# assume the fpe-batch-job role
# Get temporary credentials and export them as environment variables
echo "Assuming fpe-prod-batch-job-role..."
creds=$(aws sts assume-role \
    --role-arn arn:aws:iam::694155575325:role/fpe-prod-batch-job-role \
    --role-session-name fpe-batch-job \
    --output json)
if [ $? -ne 0 ]; then
    echo "Error: Failed to assume role. Check your AWS credentials."
    exit 1
fi

if ! echo "$creds" | jq -e '.Credentials.AccessKeyId and .Credentials.SecretAccessKey and .Credentials.SessionToken' > /dev/null; then
    echo "Error: Failed to extract credentials from assumed role response"
    echo "       Try running: aws sts assume-role --role-arn arn:aws:iam::694155575325:role/fpe-prod-batch-job-role --role-session-name fpe-batch-job --output json"
    exit 1
fi

AWS_ACCESS_KEY_ID=$(echo "$creds" | jq -er '.Credentials.AccessKeyId')
AWS_SECRET_ACCESS_KEY=$(echo "$creds" | jq -er '.Credentials.SecretAccessKey')
AWS_SESSION_TOKEN=$(echo "$creds" | jq -er '.Credentials.SessionToken')

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_SESSION_TOKEN" ]; then
    echo "Error: Failed to extract credentials from assumed role response"
    echo "       Try running: aws sts assume-role --role-arn arn:aws:iam::694155575325:role/fpe-prod-batch-job-role --role-session-name fpe-batch-job --output json"
    exit 1
fi

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_SESSION_TOKEN

echo "Successfully assumed role. Temporary credentials will expire at: $(echo "$creds" | jq -r '.Credentials.Expiration')"

echo "Terminating AWS Batch job..."
aws batch terminate-job \
    --job-id "$JOB_ID" \
    --reason "$REASON" \
    --output json

status=$?
if [ $status -eq 0 ]; then
    echo "Job termination requested successfully."
    echo "To check job status: aws batch describe-jobs --jobs $JOB_ID"
else
    echo "Failed to terminate job (error code: $status)"
    exit $status
fi
