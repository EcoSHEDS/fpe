import argparse
import boto3
import PIL
import json
import os
from io import BytesIO, StringIO
from sqlalchemy import create_engine, text, Table, MetaData, Column, Float, Integer, JSON
import pandas as pd
from detection.run_detector import load_detector

MD_CATEGORIES = {
    "1": "animal",
    "2": "person",
    "3": "vehicle"
}
DEFAULT_CONF_THRESHOLD=0.1

s3 = boto3.client('s3')

def get_secret_value(secret_name, region_name="us-east-1"):
    client = boto3.client('secretsmanager', region_name=region_name)
    response = client.get_secret_value(SecretId=secret_name)
    secret_value = json.loads(response['SecretString'])
    return secret_value

def get_db_config_from_secret(secret_value):
    config = {
        "host": secret_value['host'],
        "port": secret_value.get('port', 5432),
        "dbname": secret_value.get('dbname', 'postgres'),
        "user": secret_value['username'],
        "password": secret_value['password']
    }
    return config

def fetch_images_for_imageset_from_db(engine, imageset_id, max_images=10):
    limit = f'LIMIT {max_images}' if max_images else ''
    query = f"SELECT id, filename, full_s3 FROM images WHERE imageset_id='{imageset_id}' {limit}"
    df = pd.read_sql(query, engine)
    return df

def fetch_imageset_from_db(engine, imageset_id):
    query = f"SELECT * FROM imagesets WHERE id={imageset_id}"
    df = pd.read_sql(query, engine)
    return df.iloc[0].to_dict()

def db_connect(config):
    DATABASE_URL = f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['dbname']}"
    engine = create_engine(DATABASE_URL)
    return engine

def update_imageset_pii_status_in_db(engine, id, status):
    query = text('UPDATE imagesets SET pii_status=:status WHERE id=:id')
    engine.execute(query, {'status': status, 'id': id})
    return True

def read_image_from_s3(bucket_name, image_key):
    # Read the image from the S3 bucket
    response = s3.get_object(Bucket=bucket_name, Key=image_key)
    image_data = response['Body'].read()

    # Load the image using the PIL (Python Imaging Library) Image module
    image = PIL.Image.open(BytesIO(image_data))

    return image


def save_object_to_s3_json(bucket_name, object_key, data):
    # Convert the data to a JSON string
    json_data = json.dumps(data)

    # Save the JSON string to the S3 bucket
    s3.put_object(Bucket=bucket_name, Key=object_key,
                  Body=StringIO(json_data).getvalue())

def max_conf_per_category(data):
    max_conf = {
        'animal': 0,
        'person': 0,
        'vehicle': 0
    }

    for item in data:
        category = item['category']
        category_label = MD_CATEGORIES[category]
        max_conf[category_label] = max(max_conf[category_label], item['conf'])
    return max_conf

def save_pii_to_database(engine, results):
    data = [
        {
            'image_id': result['image_id'],
            'pii_animal': result['max_conf']['animal'],
            'pii_person': result['max_conf']['person'],
            'pii_vehicle': result['max_conf']['vehicle'],
            'pii_detections': result['detections']
        } for result in results
    ]
    with engine.connect() as conn:
        table = Table('pii_results', MetaData(bind=conn),
            Column('image_id', Integer, primary_key=True),
            Column('pii_animal', Float),
            Column('pii_person', Float),
            Column('pii_vehicle', Float),
            Column('pii_detections', JSON),
            prefixes=['TEMPORARY']
        )
        table.create(conn)
        conn.execute(table.insert(), data)

        conn.execute("""
            UPDATE images
            SET pii_animal = pii_results.pii_animal,
                pii_person = pii_results.pii_person,
                pii_vehicle = pii_results.pii_vehicle,
                pii_detections = pii_results.pii_detections
            FROM pii_results
            WHERE images.id = pii_results.image_id;
        """)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Detect PII in FPE imageset and save results to JSON file in imageset folder on S3'
    )
    parser.add_argument('imageset_id', help='Imageset ID')
    parser.add_argument(
        '--model-version',
        choices=['a', 'b'],
        default='a',
        help="MegaDetector version to use, can be 'a' or 'b' (default='a')"
    )
    parser.add_argument(
        '--threshold',
        type=float,
        default=DEFAULT_CONF_THRESHOLD,
        help=f"Confidence threshold between 0 and 1 (default={DEFAULT_CONF_THRESHOLD})")
    parser.add_argument(
        '--max-images',
        type=int,
        help='Maximum number of images to process (for testing)')
    args = parser.parse_args()
    print(args)

    secret_value = get_secret_value(os.environ['DB_SECRET_NAME'], os.environ['REGION'])
    db_config = get_db_config_from_secret(secret_value)
    db_engine = db_connect(db_config)

    print(f'fetching imageset: imageset_id={args.imageset_id}')
    imageset = fetch_imageset_from_db(db_engine, args.imageset_id)
    if not imageset:
        print(f'imageset not found: imageset_id={args.imageset_id}')
        exit(1)
    print(f'imageset: id={imageset["id"]}, uuid={imageset["uuid"]}')
    update_imageset_pii_status_in_db(db_engine, imageset['id'], 'PROCESSING')

    print(f'fetching images: imageset_id={args.imageset_id}')
    df_images = fetch_images_for_imageset_from_db(db_engine, args.imageset_id, max_images=args.max_images)
    if df_images.empty:
        print(f'no images found: imageset_id={args.imageset_id}')
        exit(1)
    print(f'images: n={len(df_images)}')

    model_file = f'model/md_v5{args.model_version}.0.0.pt'
    print(f'loading detector: {model_file}')
    detector = load_detector(model_file)

    results = []
    for _, row in df_images.iterrows():
        filename = row['filename']
        bucket = row['full_s3']['Bucket']
        key = row['full_s3']['Key']

        image = read_image_from_s3(bucket, key)

        print(f"image: id={row['id']}, filename={filename}")
        result = detector.generate_detections_one_image(image, filename, detection_threshold=args.threshold)
        del result['max_detection_conf']
        result['image_id'] = row['id']
        max_conf = max_conf_per_category(result['detections'])
        result['max_conf'] = max_conf

        results.append(result)

    bucket = df_images['full_s3'][0]['Bucket']
    key = f'imagesets/{imageset["uuid"]}/pii.json'

    print(f'saving results to s3: bucket={bucket}, key={key}')
    save_object_to_s3_json(bucket, key, results)
    save_pii_to_database(db_engine, results)

    update_imageset_pii_status_in_db(db_engine, imageset['id'], 'DONE')
