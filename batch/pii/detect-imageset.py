import argparse
import boto3
import PIL
import json
import os
import logging
from io import BytesIO, StringIO
from sqlalchemy import create_engine, text, Table, MetaData, Column, Float, Integer, JSON
import pandas as pd
from detection.run_detector import load_detector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

MD_CATEGORIES = {
    "1": "animal",
    "2": "person",
    "3": "vehicle"
}
DEFAULT_CONF_THRESHOLD=0.1

s3 = boto3.client('s3')

def get_secret_value(secret_name, region_name="us-east-1"):
    logger.debug(f"Fetching secret value for {secret_name} in region {region_name}")
    client = boto3.client('secretsmanager', region_name=region_name)
    response = client.get_secret_value(SecretId=secret_name)
    secret_value = json.loads(response['SecretString'])
    return secret_value

def get_db_config_from_secret(secret_value):
    logger.debug("Extracting database configuration from secret")
    config = {
        "host": secret_value['host'],
        "port": secret_value.get('port', 5432),
        "dbname": secret_value.get('dbname', 'postgres'),
        "user": secret_value['username'],
        "password": secret_value['password']
    }
    return config

def fetch_images_for_imageset_from_db(engine, imageset_id, max_images=10):
    logger.debug(f"Fetching images for imageset {imageset_id} with max_images={max_images}")
    limit = f'LIMIT {max_images}' if max_images else ''
    query = f"SELECT id, filename, full_s3 FROM images WHERE imageset_id='{imageset_id}' {limit}"
    df = pd.read_sql(query, engine)
    return df

def fetch_imageset_from_db(engine, imageset_id):
    logger.debug(f"Fetching imageset {imageset_id} from database")
    query = f"SELECT * FROM imagesets WHERE id={imageset_id}"
    df = pd.read_sql(query, engine)
    return df.iloc[0].to_dict()

def db_connect(config):
    logger.debug("Connecting to database")
    DATABASE_URL = f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['dbname']}"
    engine = create_engine(DATABASE_URL)
    return engine

def update_imageset_pii_status_in_db(engine, id, status):
    logger.debug(f"Updating imageset {id} status to {status}")
    query = text('UPDATE imagesets SET pii_status=:status WHERE id=:id')
    engine.execute(query, {'status': status, 'id': id})
    return True

def read_image_from_s3(bucket_name, image_key):
    logger.debug(f"Reading image from S3: bucket={bucket_name}, key={image_key}")
    try:
        response = s3.get_object(Bucket=bucket_name, Key=image_key)
        image_data = response['Body'].read()
        image = PIL.Image.open(BytesIO(image_data))
        return image
    except Exception as e:
        logger.error(f"Failed to read image from S3: {str(e)}")
        raise

def save_object_to_s3_json(bucket_name, object_key, data):
    logger.debug(f"Saving JSON data to S3: bucket={bucket_name}, key={object_key}")
    try:
        json_data = json.dumps(data)
        s3.put_object(Bucket=bucket_name, Key=object_key,
                     Body=StringIO(json_data).getvalue())
    except Exception as e:
        logger.error(f"Failed to save data to S3: {str(e)}")
        raise

def max_conf_per_category(data):
    logger.debug("Calculating maximum confidence per category")
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
    logger.debug(f"Saving {len(results)} PII results to database")
    try:
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
    except Exception as e:
        logger.error(f"Failed to save PII results to database: {str(e)}")
        raise

def run(imageset_id, model_version='a', threshold=DEFAULT_CONF_THRESHOLD, max_images=None, debug=False):
    """
    Run PII detection on an imageset.
    
    Args:
        imageset_id: ID of the imageset to process
        model_version: MegaDetector version to use ('a' or 'b')
        threshold: Confidence threshold between 0 and 1
        max_images: Maximum number of images to process (for testing)
        debug: Whether to enable debug logging
        
    Returns:
        bool: True if processing completed successfully, False otherwise
    """
    if debug:
        logger.setLevel(logging.DEBUG)
    logger.info(f"Starting PII detection with arguments: imageset_id={imageset_id}, model_version={model_version}, threshold={threshold}, max_images={max_images}")

    try:
        secret_value = get_secret_value(os.environ['DB_SECRET_NAME'], os.environ['REGION'])
        db_config = get_db_config_from_secret(secret_value)
        db_engine = db_connect(db_config)

        logger.info(f'Fetching imageset: imageset_id={imageset_id}')
        imageset = fetch_imageset_from_db(db_engine, imageset_id)
        if not imageset:
            logger.error(f'Imageset not found: imageset_id={imageset_id}')
            return False
        logger.info(f'Found imageset: id={imageset["id"]}, uuid={imageset["uuid"]}')
        update_imageset_pii_status_in_db(db_engine, imageset['id'], 'PROCESSING')

        logger.info(f'Fetching images: imageset_id={imageset_id}')
        df_images = fetch_images_for_imageset_from_db(db_engine, imageset_id, max_images=max_images)
        if df_images.empty:
            logger.error(f'No images found: imageset_id={imageset_id}')
            return False
        logger.info(f'Found {len(df_images)} images to process')

        model_file = f'model/md_v5{model_version}.0.0.pt'
        logger.info(f'Loading detector: {model_file}')
        detector = load_detector(model_file)

        results = []
        for idx, row in df_images.iterrows():
            filename = row['filename']
            bucket = row['full_s3']['Bucket']
            key = row['full_s3']['Key']

            logger.info(f"Processing image {idx + 1}/{len(df_images)}: id={row['id']}, filename={filename}")
            image = read_image_from_s3(bucket, key)
            result = detector.generate_detections_one_image(image, filename, detection_threshold=threshold)
            del result['max_detection_conf']
            result['image_id'] = row['id']
            max_conf = max_conf_per_category(result['detections'])
            result['max_conf'] = max_conf
            results.append(result)
            logger.debug(f"Detected PII in image {filename}: {max_conf}")

        bucket = df_images['full_s3'][0]['Bucket']
        key = f'imagesets/{imageset["uuid"]}/pii.json'

        logger.info(f'Saving results to S3: bucket={bucket}, key={key}')
        save_object_to_s3_json(bucket, key, results)
        save_pii_to_database(db_engine, results)

        update_imageset_pii_status_in_db(db_engine, imageset['id'], 'DONE')
        logger.info("PII detection completed successfully")
        return True

    except Exception as e:
        logger.error(f"An error occurred during PII detection: {str(e)}", exc_info=True)
        if 'imageset' in locals():
            update_imageset_pii_status_in_db(db_engine, imageset['id'], 'ERROR')
        return False

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
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug logging')
    args = parser.parse_args()
    
    success = run(
        imageset_id=args.imageset_id,
        model_version=args.model_version,
        threshold=args.threshold,
        max_images=args.max_images,
        debug=args.debug
    )
    
    exit(0 if success else 1)
