#!/bin/bash
# Create PII Detector jobs in AWS Batch
# usage: ./batch-create-pii-job.sh <imageset ID | --file <path_to_file>> [--workers <num>] [--batch-size <num>]
# examples:
#   ./batch-create-pii-job.sh 123 --workers 10 --batch-size 200
#   ./batch-create-pii-job.sh --file imagesets.txt --workers 10

# Instead of set -e, we'll handle errors manually
# This allows batch processing to continue even if one job fails

# Check for jq dependency
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq first."
    echo "  macOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  Amazon Linux: sudo yum install jq"
    exit 1
fi

# Default values
WORKERS=7
BATCH_SIZE=100
IMAGESET_ID=""
IMAGESETS_FILE=""
BATCH_MODE=false

# Parse command line arguments
if [ $# -eq 0 ]; then
    echo "Error: Missing imageset ID or file"
    echo "Usage: ./batch-create-pii-job.sh <imageset ID | --file <path_to_file>> [--workers <num>] [--batch-size <num>]"
    echo "Examples:"
    echo "  ./batch-create-pii-job.sh 123 --workers 10 --batch-size 200"
    echo "  ./batch-create-pii-job.sh --file imagesets.txt --workers 10"
    exit 1
fi

# Check if first argument is a file flag or an imageset ID
if [ "$1" == "--file" ]; then
    if [ -z "$2" ]; then
        echo "Error: --file requires a file path argument"
        exit 1
    fi
    IMAGESETS_FILE="$2"
    BATCH_MODE=true
    shift 2
else
    IMAGESET_ID=$1
    shift
fi

# Parse optional arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --workers)
            if [[ -n "$2" ]] && [[ "$2" =~ ^[0-9]+$ ]]; then
                WORKERS=$2
                shift 2
            else
                echo "Error: --workers requires a numeric argument"
                exit 1
            fi
            ;;
        --batch-size)
            if [[ -n "$2" ]] && [[ "$2" =~ ^[0-9]+$ ]]; then
                BATCH_SIZE=$2
                shift 2
            else
                echo "Error: --batch-size requires a numeric argument"
                exit 1
            fi
            ;;
        --file)
            if [ -n "$2" ]; then
                IMAGESETS_FILE="$2"
                BATCH_MODE=true
                shift 2
            else
                echo "Error: --file requires a file path argument"
                exit 1
            fi
            ;;
        *)
            echo "Error: Unknown option: $1"
            echo "Usage: ./batch-create-pii-job.sh <imageset ID | --file <path_to_file>> [--workers <num>] [--batch-size <num>]"
            exit 1
            ;;
    esac
done

# Validate inputs
if [ "$BATCH_MODE" = true ]; then
    if [ ! -f "$IMAGESETS_FILE" ]; then
        echo "Error: File not found: $IMAGESETS_FILE"
        exit 1
    fi

    if [ ! -s "$IMAGESETS_FILE" ]; then
        echo "Error: File is empty: $IMAGESETS_FILE"
        exit 1
    fi
else
    if [ -z "$IMAGESET_ID" ]; then
        echo "Error: Missing imageset ID"
        exit 1
    fi
fi

TIMESTAMP=$(date "+%Y%m%d%H%M")

echo "Configuration:"
echo "  Workers: ${WORKERS}"
echo "  Batch Size: ${BATCH_SIZE}"
if [ "$BATCH_MODE" = true ]; then
    echo "  Processing multiple imagesets from: ${IMAGESETS_FILE}"
    IMAGESET_COUNT=$(grep -v "^[[:space:]]*$\|^[[:space:]]*#" "$IMAGESETS_FILE" | wc -l | tr -d ' ')
    echo "  Number of imagesets: ${IMAGESET_COUNT}"
else
    echo "  Imageset ID: ${IMAGESET_ID}"
fi

# assume the fpe-batch-job role
# Get temporary credentials and export them as environment variables
echo "Assuming fpe-prod-batch-job-role..."
creds=$(aws sts assume-role --role-arn arn:aws:iam::694155575325:role/fpe-prod-batch-job-role --role-session-name fpe-batch-job)
if [ $? -ne 0 ]; then
    echo "Error: Failed to assume role. Check your AWS credentials."
    exit 1
fi

export AWS_ACCESS_KEY_ID=$(echo $creds | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $creds | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $creds | jq -r '.Credentials.SessionToken')

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_SESSION_TOKEN" ]; then
    echo "Error: Failed to extract credentials from assumed role response"
    exit 1
fi

echo "Successfully assumed role. Temporary credentials will expire at: $(echo $creds | jq -r '.Credentials.Expiration')"

# Submit job(s)
submit_job() {
    local imageset_id=$1
    echo "Submitting PII detection job for imageset ${imageset_id}..."
    job_response=$(aws batch submit-job \
        --job-name pii-imageset-${imageset_id}-${TIMESTAMP} \
        --job-queue fpe-prod-batch-job-queue \
        --job-definition fpe-prod-batch-job-definition-pii \
        --container-overrides command='["detect-fpe-imageset","--workers","'"${WORKERS}"'","--batch-size","'"${BATCH_SIZE}"'","'"${imageset_id}"'"]')

    local status=$?
    if [ $status -eq 0 ]; then
        job_id=$(echo $job_response | jq -r '.jobId')
        echo "✅ Job submitted successfully!"
        echo "   Job ID: $job_id"
        echo "   Job Name: pii-imageset-${imageset_id}-${TIMESTAMP}"
        return 0
    else
        echo "❌ Failed to submit job for imageset ${imageset_id} (error code: $status)"
        return 1
    fi
}

if [ "$BATCH_MODE" = true ]; then
    success_count=0
    failure_count=0

    # Process file line by line
    echo "Starting batch processing..."

    while IFS= read -r id || [ -n "$id" ]; do
        # Skip empty lines and lines starting with #
        if [[ -z "$id" || "$id" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Trim whitespace
        id=$(echo "$id" | xargs)

        echo "Processing imageset ID: $id"

        if submit_job "$id"; then
            ((success_count++))
        else
            ((failure_count++))
            echo "Continuing with next imageset despite failure..."
        fi

        # Add a small delay between job submissions to avoid throttling
        sleep 1
    done < "$IMAGESETS_FILE"

    echo "------------------------------"
    echo "Batch processing complete:"
    echo "  Total jobs submitted: $success_count"
    if [ $failure_count -gt 0 ]; then
        echo "  Failed submissions: $failure_count"
    fi
    echo "To check job status: aws batch list-jobs --job-queue fpe-prod-batch-job-queue --filters name=JOB_NAME,values=pii-imageset"
else
    submit_job "$IMAGESET_ID"
    status=$?
    if [ $status -ne 0 ]; then
        echo "Failed to submit job (error code: $status)"
        exit $status
    fi
    echo "To check job status: aws batch describe-jobs --jobs \$JOB_ID"
fi
