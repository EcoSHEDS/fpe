#!/bin/bash
# Create prediction jobs by imageset in AWS Batch
# usage: ./create-job-predict.sh --station-id <station_id> --model-code <model_code> --imageset-uuid <imageset_uuid>
# example:
#   ./create-job-predict.sh --station-id 29 --model-code RANK-FLOW-20240410 --imageset-uuid 00000000-0000-0000-0000-000000000000

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

STATION_ID=""
MODEL_CODE=""
IMAGESET_UUID=""

usage() {
    echo "Usage: ./create-job-predict.sh --station-id <station_id> --model-code <model_code> --imageset-uuid <imageset_uuid>"
    echo "Example:"
    echo "  ./create-job-predict.sh --station-id 29 --model-code RANK-FLOW-20240410 --imageset-uuid 00000000-0000-0000-0000-000000000000"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    echo "Error: Missing required arguments"
    usage
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case "$1" in
        --station-id)
            if [ -n "$2" ]; then
                STATION_ID="$2"
                shift 2
            else
                echo "Error: --station-id requires an argument"
                exit 1
            fi
            ;;
        --model-code)
            if [ -n "$2" ]; then
                MODEL_CODE="$2"
                shift 2
            else
                echo "Error: --model-code requires an argument"
                exit 1
            fi
            ;;
        --imageset-uuid)
            if [ -n "$2" ]; then
                IMAGESET_UUID="$2"
                shift 2
            else
                echo "Error: --imageset-uuid requires an argument"
                exit 1
            fi
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Error: Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

if [ -z "$STATION_ID" ]; then
    echo "Error: Missing --station-id"
    usage
    exit 1
fi

if [ -z "$MODEL_CODE" ]; then
    echo "Error: Missing --model-code"
    usage
    exit 1
fi

if [ -z "$IMAGESET_UUID" ]; then
    echo "Error: Missing --imageset-uuid"
    usage
    exit 1
fi

if ! [[ "$STATION_ID" =~ ^[0-9]+$ ]]; then
    echo "Error: --station-id must be numeric"
    exit 1
fi

TIMESTAMP=$(date "+%Y%m%d%H%M%S%3N")
JOB_NAME="predict-station-${STATION_ID}-${TIMESTAMP}"

echo "Configuration:"
echo "  Station ID: ${STATION_ID}"
echo "  Model Code: ${MODEL_CODE}"
echo "  Imageset UUID: ${IMAGESET_UUID}"

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

container_overrides=$(jq -nc \
    --arg station_id "$STATION_ID" \
    --arg model_code "$MODEL_CODE" \
    --arg imageset_uuid "$IMAGESET_UUID" \
    '{command:["--station-id",$station_id,"--model-code",$model_code,"--imageset-uuid",$imageset_uuid]}')

echo "Submitting predict job..."
job_response=$(aws batch submit-job \
    --job-name "$JOB_NAME" \
    --job-queue fpe-prod-batch-job-queue \
    --job-definition fpe-prod-batch-job-definition-predict \
    --container-overrides "$container_overrides" \
    --output json)

status=$?
if [ $status -eq 0 ]; then
    job_id=$(echo "$job_response" | jq -r '.jobId')
    echo "Job submitted successfully!"
    echo "   Job ID: $job_id"
    echo "   Job Name: $JOB_NAME"
    echo "To check job status: aws batch describe-jobs --jobs $job_id"
else
    echo "Failed to submit predict job (error code: $status)"
    exit $status
fi
