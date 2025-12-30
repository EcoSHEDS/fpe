# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

USGS Flow Photo Explorer (FPE) is a cloud-native web application for managing and exploring flow photography monitoring stations. It consists of a Vue 2 frontend, Express.js API backend, PostgreSQL database, AWS Batch processors, and Lambda functions.

## Repository Structure

```
fpe/
├── app/              # Vue 2 frontend (Vuetify 2)
├── api/              # Express.js REST API
├── cli/              # Command-line interface
├── db/               # Database migrations, models, seeds
├── batch/            # AWS Batch processing (datasets, imagesets, PII detection)
├── lambda/           # AWS Lambda functions (trigger, worker, models)
├── cloudformation/   # AWS infrastructure templates
├── r/                # R scripts for data export
└── data/             # Sample data files
```

## Development Commands

### Frontend (app/)

```bash
cd app
npm install
npm run serve          # Start dev server at http://localhost:8080
npm run lint          # Lint Vue files
npm run build         # Production build
npm run stage         # Staging build
npm run deploy:stage  # Build and deploy to staging S3
npm run deploy        # Build and deploy to production S3
```

### API (api/)

```bash
cd api
npm install
npm start             # Start dev server with nodemon (NODE_ENV=development)
```

The API runs on port 3000 in development (configured via `PORT` env variable).

### Database Migrations

**IMPORTANT**: Always set `NODE_ENV` before running migrations/seeds.

```bash
export NODE_ENV=development  # or staging, production

# Migrations
knex migrate:latest          # Run all pending migrations
knex migrate:rollback        # Rollback last batch
knex migrate:up              # Run next migration
knex migrate:down            # Rollback last migration
knex migrate:make <name>     # Create new migration (use snake_case)

# Seeds
knex seed:run                # Run seeds for current environment
```

Database configuration is in [knexfile.js](knexfile.js) at the root.

### CLI Tool

The CLI provides direct database access for management tasks:

```bash
npm link                     # Make CLI globally available as 'fpe'
export NODE_ENV=development

fpe help
fpe users list
fpe stations list
fpe stations create -u <user_id> -n "Station Name" -l <lat> -g <lng>
fpe datasets create -s <station_id> -t datetime -v "flow_cfs"="FLOW_CFS" <file.csv>
fpe imagesets create <images_folder> -s <station_id>
```

### Linting

```bash
# Root and API (uses standard style)
npm run lint          # (if configured in root package.json)
eslint .

# App (uses vue/essential + @vue/standard)
cd app
npm run lint
```

### Batch Processor (Local Testing)

```bash
cd batch/processor
npm install

# Process dataset
node index.js dataset -i <dataset_id>

# Process imageset
node index.js imageset -i <imageset_id>

# PII detection
node index.js pii -i <imageset_id>
```

## Architecture

### Monorepo Structure

This is a **monorepo** with three separate Node.js projects:
- **Root** (api/): Shared database models, migrations, CLI
- **app/**: Vue frontend
- **batch/processor/**: AWS Batch processing jobs

Each has its own `package.json` and `node_modules`.

### Database Architecture (Objection.js ORM)

**Core Models** (db/models/):

- **User** - User accounts (maps to AWS Cognito)
  - Relations: stations, annotations, station_permissions
- **Station** - Monitoring stations
  - Relations: user (owner), datasets, imagesets, annotations, models, permissions
  - Fields: public (boolean), latitude, longitude
- **Dataset** - CSV time-series data
  - Relations: station, series
  - Status: CREATED → PROCESSING → DONE/FAILED
- **Imageset** - Photo collections
  - Relations: station, images
  - Status: CREATED → QUEUED → PROCESSING → DONE/FAILED
  - PII status: PENDING → QUEUED → PROCESSING → DONE/FAILED
- **Image** - Individual photos with EXIF data
  - Relations: imageset
  - Stores: timestamp, dimensions, orientation, PII flags
- **Annotation** - User annotations on images
- **Series** - Time-series variables within datasets
  - Relations: dataset, variable, values
- **Value** - Individual time-series measurements
- **Variable** - Standard variable types (flow, stage, etc.)
- **StationPermission** - Collaborator access (many-to-many join)
- **Model** - ML models for stations

**Key Patterns**:
- All models use UUID primary keys
- Foreign keys use snake_case (e.g., `station_id`, `user_id`)
- Status enums track processing workflows
- Timestamps: `created_at`, `updated_at` (auto-managed)
- PostgreSQL stored functions for complex queries (e.g., `f_station_summary()`, `f_station_daily()`)

### API Routes (api/routes/)

Three route groups with different auth levels:

**Public** (`/public`):
- No authentication required
- Read-only access to public stations, datasets, images, series

**Restricted** (`/restricted`):
- Requires AWS Cognito JWT authentication
- User can manage their own stations, datasets, imagesets, annotations
- Access control: owner or collaborator with granted permissions

**Admin** (`/admin`):
- Requires `admins` Cognito user group
- Full access to all resources
- User management, system-wide statistics

**Authentication Flow**:
1. Frontend uses AWS Amplify to authenticate with Cognito
2. JWT token attached to API requests as `Authorization: Bearer <token>`
3. API middleware validates token (via `attachUser` middleware)
4. User claims extracted and database user record fetched
5. Role-based access control checks ownership or admin status

**Key Middleware** (api/middleware/):
- `attachUser` - Validates JWT and attaches user to `req.user`
- `requireAdmin` - Checks for admin group membership

### Vue Application (app/src/)

**Tech Stack**:
- Vue 2.6 + Vue Router + Vuex
- Vuetify 2 (Material Design)
- AWS Amplify (authentication)
- Axios with retry-axios (API client)
- Highcharts (charts), Leaflet (maps)

**Main Routes**:
- `/` - Home page
- `/explorer` - Browse public stations
- `/manage` - User's station management
- `/annotator` - Image annotation tool
- `/admin` - Admin dashboard

**State Management**:
- Simple Vuex store: `user` (Cognito), `dbUser` (database record)
- Event bus (events.js) for cross-component communication

**Key Components** (app/src/components/):
- `StationMap` - Leaflet map with station markers
- `ImageGallery` - Image viewer with lightbox
- `TimeseriesChart` - Highcharts visualization
- `AnnotationEditor` - Annotation interface

### AWS Batch Processing

**Workflow**:
1. User uploads files to S3 via pre-signed POST URLs
2. User triggers processing via API
3. API submits AWS Batch job
4. Batch processor (Docker container):
   - Fetches data from S3 and database
   - Processes data (parse, validate, transform)
   - Generates derived data (thumbnails, statistics)
   - Updates database with results
   - For imagesets: triggers PII detection batch job

**Dataset Processing** (batch/processor/processors/dataset.js):
- Parses CSV files with PapaParse
- Validates data types and structure
- Normalizes into Series/Value tables
- Calculates statistics (min, max, mean, etc.)

**Imageset Processing** (batch/processor/processors/imageset.js):
- Downloads images from S3
- Extracts EXIF data (timestamp, GPS, orientation)
- Auto-rotates based on EXIF orientation
- Generates 400px width thumbnails using Sharp
- Uploads thumbnails to S3
- Submits PII detection job

**PII Detection**:
- Uses AWS Rekognition DetectLabels API
- Detects persons, vehicles, animals
- Flags images containing PII
- Updates `pii_status` and `pii_labels` fields

### Lambda Functions

**Trigger** (lambda/trigger/):
- Cognito post-confirmation trigger
- Sends SNS notification for new user registrations

**Worker** (lambda/worker/):
- Administrative tasks via direct invocation
- `deleteS3Objects`, `listS3Objects`, `createAdminUser`

**Models** (lambda/models/):
- Python-based ML model inference
- Processes SageMaker batch transform outputs

### Configuration

Uses `dotenv-flow` for environment-specific configuration:
- `.env` - Shared defaults (tracked)
- `.env.development.local` - Local development (not tracked)
- `.env.production.local` - Production secrets (not tracked)

**Required Variables**:
```bash
# API
PORT=3000                    # Local dev only
REGION=us-east-1            # AWS region
BUCKET=<bucket-name>        # S3 storage bucket
DB_SECRET_NAME=<secret>     # Secrets Manager secret name

# Database (local dev, overrides DB_SECRET_NAME)
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=fpe
DB_USER=postgres
DB_PASSWORD=<password>

# App (Vue)
VUE_APP_API_ENDPOINT=<api-url>
VUE_APP_COGNITO_REGION=<region>
VUE_APP_COGNITO_USER_POOL_ID=<pool-id>
VUE_APP_COGNITO_USER_POOL_WEB_CLIENT_ID=<client-id>
VUE_APP_COGNITO_IDENTITY_POOL_ID=<pool-id>
VUE_APP_STORAGE_BUCKET=<bucket-name>
```

## Development Workflow

### Local Development Setup

1. Install Node.js (version specified in [.nvmrc](.nvmrc))
   ```bash
   nvm use
   ```

2. Install dependencies for all projects:
   ```bash
   npm install          # Root (API, CLI, database)
   cd app && npm install
   cd ../batch/processor && npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.development.local.example .env.development.local  # If exists
   # Edit .env.development.local with local database credentials
   ```

4. Set up database:
   ```bash
   export NODE_ENV=development
   knex migrate:latest
   knex seed:run  # Optional: load sample data
   ```

5. Start API and app:
   ```bash
   # Terminal 1: API
   cd api && npm start

   # Terminal 2: App
   cd app && npm run serve
   ```

6. Access app at http://localhost:8080

### Making Database Changes

1. Create migration:
   ```bash
   export NODE_ENV=development
   knex migrate:make add_field_to_table
   ```

2. Edit migration file in `db/migrations/`
   - Use `knex.schema.table()` for schema changes
   - Use snake_case for column names
   - Add both `up` and `down` methods

3. Run migration:
   ```bash
   knex migrate:latest
   ```

4. Update Objection.js model in `db/models/` if needed

### AWS S3 File Management

```bash
export BUCKET=<bucket-name>

# List all files
aws s3 ls s3://${BUCKET}/ --recursive

# List datasets
aws s3 ls s3://${BUCKET}/datasets/ --recursive

# List imagesets
aws s3 ls s3://${BUCKET}/imagesets/

# Delete imageset files
aws s3 rm s3://${BUCKET}/ --recursive --exclude "*" --include "imagesets/<uuid>/*"

# Delete dataset files
aws s3 rm s3://${BUCKET}/ --recursive --exclude "*" --include "datasets/<uuid>/*"

# Sync local folder to S3 (for dev seeds)
aws s3 sync storage s3://${BUCKET}/ --exclude "*" --include "imagesets/*" --include "datasets/*"
```

## Important Notes

### Database Type Handling

PostgreSQL `date` type parser is overridden to prevent automatic conversion to JavaScript Date objects (see [knexfile.js](knexfile.js:9-10)).

### Production vs Development

**Development**:
- API runs as Express server (nodemon)
- Direct database connection via env variables
- Mock JWT validation middleware

**Production**:
- API runs as Lambda via aws-serverless-express
- Database credentials from AWS Secrets Manager
- API Gateway handles routing and JWT validation
- App served from S3 + CloudFront

### Common Issues

**Migration fails with "relation already exists"**:
- Check if migration was already run: `knex migrate:list`
- Verify NODE_ENV matches target environment

**API can't connect to database**:
- Verify database is running
- Check DB_* environment variables
- Ensure NODE_ENV is set for correct config

**Images not displaying**:
- Check S3 bucket permissions (CORS configured)
- Verify files exist: `aws s3 ls s3://${BUCKET}/imagesets/<uuid>/`
- Check image processing status in database

**Authentication errors**:
- Verify Cognito user pool configuration
- Check JWT token is being sent in Authorization header
- Ensure user exists in database (created by Cognito trigger)
