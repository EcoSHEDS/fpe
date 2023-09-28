import json
import os
import csv
import boto3
from io import StringIO

s3 = boto3.client("s3")

def process_transform_output(event, context):
  bucket_name = event.get("bucket_name", None)
  data_file = event.get("data_file", None)
  data_prefix = event.get("data_prefix", None)
  output_prefix = event.get("output_prefix", None)
  n = event.get("n", None)
  skip = event.get("skip", None)
  start = skip
  end = skip + n - 1
  output_file = f"{output_prefix}/predictions-{start:05n}-{end:05n}.csv"

  if not all([bucket_name, data_file, output_prefix]):
    return {
      "statusCode": 400,
      "body": ("Missing required parameters (bucket, data_file, output_prefix).")
    }
  # Fetch the CSV file from S3
  print(f"fetching data_file(Bucket={bucket_name}, Key={data_file})")
  csv_obj = s3.get_object(Bucket=bucket_name, Key=data_file)
  csv_body = csv_obj["Body"].read().decode("utf-8")

  # Prepare to read and update CSV
  csv_reader = csv.DictReader(StringIO(csv_body))
  field_names = csv_reader.fieldnames + ["score"] # Adding "score" to column names

  # Initialize an empty list to hold updated rows
  updated_rows = []

  # Loop through each row in the CSV
  print(f"processing rows {start} to {end} (skip={skip}, n={n})")
  i = 1
  for idx, row in enumerate(csv_reader):
    if (idx < start or idx > end): continue

    # Fetch the JSON file using the key in the "key" column
    filename = row["filename"]
    out_key = f"{data_prefix}/{filename}.out"

    print(f"{i}/{n} fetching json(Bucket={bucket_name}, Key={out_key})")
    json_obj = s3.get_object(Bucket=bucket_name, Key=out_key)
    json_body = json_obj["Body"].read().decode("utf-8")
    json_data = json.loads(json_body)

    # Update the "score" in the CSV row
    row["score"] = json_data.get("score", None)

    # Append this updated row to the list
    updated_rows.append(row)
    i += 1

  # Create a new CSV with updated rows
  output_csv_buffer = StringIO()
  csv_writer = csv.DictWriter(output_csv_buffer, fieldnames=field_names)
  csv_writer.writeheader()
  csv_writer.writerows(updated_rows)

  # Save the updated CSV back to S3
  s3.put_object(
    Body=output_csv_buffer.getvalue(),
    Bucket=bucket_name,
    Key=output_file
  )

  return {
    "statusCode": 200,
    "body": json.dumps(f"Batch transform output saved to: s3://{bucket_name}/{output_file}")
  }

def handler(event, context):
  action = event.get("action", None)

  if action == "process_transform_output":
    return process_transform_output(event, context)
  else:
    return {
      "statusCode": 400,
      "body": f"Invalid action ({action})"
    }
