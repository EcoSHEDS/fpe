#!/bin/bash
# Create prediction jobs from a whitespace-separated input file.
# usage: ./batch-create-job-predict.sh <path_to_file>
# input rows: <station_id> <model_code> <imageset_uuid>
# example:
#   ./batch-create-job-predict.sh model-imagesets.txt

# Instead of set -e, we'll handle errors manually
# This allows batch processing to continue even if one job fails

usage() {
    echo "Usage: ./batch-create-job-predict.sh <path_to_file>"
    echo "Input rows must be whitespace-separated:"
    echo "  <station_id> <model_code> <imageset_uuid>"
    echo "Example:"
    echo "  ./batch-create-job-predict.sh model-imagesets.txt"
}

if [ $# -ne 1 ]; then
    echo "Error: Expected exactly one input file argument"
    usage
    exit 1
fi

INPUT_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREATE_JOB_SCRIPT="${SCRIPT_DIR}/create-job-predict.sh"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File not found: $INPUT_FILE"
    exit 1
fi

if [ ! -s "$INPUT_FILE" ]; then
    echo "Error: File is empty: $INPUT_FILE"
    exit 1
fi

if [ ! -x "$CREATE_JOB_SCRIPT" ]; then
    echo "Error: Create job script is not executable: $CREATE_JOB_SCRIPT"
    exit 1
fi

echo "Processing predict jobs from: ${INPUT_FILE}"

success_count=0
failure_count=0
skipped_count=0
line_number=0

while IFS= read -r line || [ -n "$line" ]; do
    ((line_number++))

    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*$ || "$line" =~ ^[[:space:]]*# ]]; then
        ((skipped_count++))
        continue
    fi

    read -r station_id model_code imageset_uuid extra <<< "$line"

    if [ -z "$station_id" ] || [ -z "$model_code" ] || [ -z "$imageset_uuid" ] || [ -n "$extra" ]; then
        echo "Error: Invalid row ${line_number}. Expected: <station_id> <model_code> <imageset_uuid>"
        echo "       Row: $line"
        ((failure_count++))
        continue
    fi

    echo "------------------------------"
    echo "Processing row ${line_number}: station ${station_id}, model ${model_code}, imageset ${imageset_uuid}"

    "$CREATE_JOB_SCRIPT" \
        --station-id "$station_id" \
        --model-code "$model_code" \
        --imageset-uuid "$imageset_uuid"

    status=$?
    if [ $status -eq 0 ]; then
        ((success_count++))
    else
        echo "Failed to submit predict job for row ${line_number} (error code: $status)"
        echo "Continuing with next row despite failure..."
        ((failure_count++))
    fi

    # Add a small delay between job submissions to avoid throttling
    sleep 1
done < "$INPUT_FILE"

echo "------------------------------"
echo "Batch processing complete:"
echo "  Jobs submitted successfully: $success_count"
echo "  Failed rows/submissions: $failure_count"
echo "  Skipped rows: $skipped_count"

if [ $failure_count -gt 0 ]; then
    exit 1
fi
