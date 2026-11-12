# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

USGS Flow Photo Explorer (FPE) is a web application for managing and exploring photos and time-series data from stream monitoring stations. It has a Vue 2 frontend, an Express API that runs on AWS Lambda, a PostgreSQL database, AWS Batch processors, and Lambda functions.

## Repository Structure

```
fpe/
├── app/              # Vue 2 + Vuetify 2 frontend (own package.json)
├── api/              # Express REST API (own package.json)
├── cli/              # `fpe` command-line tool (uses root package.json)
├── db/               # Knex migrations, seeds, Objection models, enum types (uses root package.json)
├── batch/processor/  # AWS Batch job for datasets and imagesets (own package.json)
├── lambda/           # trigger and worker (Node.js), email and models (Python)
├── cloudformation/   # Templates and deploy scripts (see cloudformation/README.md)
├── r/                # R scripts for data export
├── scripts/          # Shell scripts for AWS Batch jobs
└── knexfile.js       # Database config for migrations, seeds and the CLI
```

Each directory with its own `package.json` has its own `node_modules`. Run `npm install` in each one.

The root project uses the Node.js version in `.nvmrc`, knex 3 and objection 3. The batch processor runs in a `node:14-alpine` container with knex 0.21 and objection 2. Do not use newer Node.js syntax or newer knex and objection APIs in `batch/processor/`.

## Commands

There are no automated tests. The root `package.json` has no scripts.

```bash
# API: must be started from api/ because start.js loads .env files from ../
cd api && npm start            # nodemon, NODE_ENV=development, port from PORT in .env

# App
cd app
npm run serve                  # Dev server
npm run lint
npm run build                  # Production build
npm run stage                  # Staging build

# Lint api, cli and db from the repository root (standard style); lint app/ with its own command
npx eslint api cli db knexfile.js

# Database: always set NODE_ENV first, then run knex from the repository root
export NODE_ENV=development
knex migrate:latest
knex migrate:rollback
knex migrate:make <name_in_snake_case>
knex seed:run

# CLI: run `npm link` one time, then set NODE_ENV
fpe users list
fpe stations create -u <user_id> -n "Station Name" -l <lat> -g <lng>
fpe datasets create <file.csv> -s <station_id> -t <timestamp_column> -v "<column>=<variable_id>"
fpe imagesets create <folder> -s <station_id>

# Batch processor: local run
cd batch/processor
node process.js dataset <id> [<id>...]    # or --all for all datasets with status CREATED
node process.js imageset <id>             # both commands accept --dry-run
```

`npm run deploy` and `npm run deploy:stage` in `app/` build the app and then sync it to the production and staging S3 buckets. Do not run them unless the user asks.

## Database

- Edit Objection models only in `db/models/`. Then run `./copy-db.sh` from the repository root. The script copies the models to `api/db/models/` and `batch/processor/models/`. Both copies are tracked in git, so commit them together with the source.
- All schema changes go through migrations in `db/migrations/`. Write both `up` and `down`.
- Many queries use PostgreSQL functions (`f_station_summary`, `f_station_daily`, `f_station_images`, `f_station_values`, `f_station_random_image_pairs`, `image_has_pii`, and others). The function bodies are in the migrations. To change a function, add a new migration that replaces it. Search `db/migrations/` for the function name to find the latest definition.
- The `status_type` enum is shared by datasets, imagesets, images, annotations and models. The values are `CREATED`, `UPLOADING`, `QUEUED`, `PROCESSING`, `DONE`, `FAILED` (`db/types/status.js`) and `IN_PROGRESS` (added by a later migration, not in that file). Imagesets also have a `pii_status` column of the same type.
- Station visibility is the `private` column (default `false`). There is no `public` column.
- Image PII columns: `pii_person`, `pii_vehicle`, `pii_animal` (detector scores), `pii_on` and `pii_off` (manual overrides), `pii_detections` (JSON).
- The `pg` parser for the `date` type is overridden in the knexfiles so that dates stay as strings and are not converted to JavaScript `Date` objects.
- Database credentials come from AWS Secrets Manager when `DB_SECRET_NAME` is set. If it is not set, the `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER` and `DB_PASSWORD` variables are used.

## API

- `api/lambda.js` is the Lambda entry point (`@codegenie/serverless-express`). `api/start.js` is the local server. Both use `api/app.js`.
- Layout: `api/routes/{public,restricted,admin}/` define the routes and `api/controllers/` contain the handlers. `api/knexfile.js` and `api/db/` are separate from the root files because the API is packaged for Lambda by itself.
- `/public` needs no authentication. `/restricted` uses `attachUser`. `/admin` uses `attachUser` and `requireAdmin`.
- The API does not validate JWTs. API Gateway does that with a Cognito authorizer. `attachUser` in `api/middleware/auth.js` reads the claims from the Lambda event and sets `req.auth = { id, isAdmin, claims }`. The `admins` Cognito group sets `isAdmin`.
- When the API runs locally with `npm start`, there is no Lambda event. `attachUser` then reads `LOCAL_AUTH_USER_ID` (a `users.id` value from the local database) and `LOCAL_AUTH_IS_ADMIN` from the environment. If `LOCAL_AUTH_USER_ID` is not set, all `/restricted` and `/admin` requests return 401. `LOCAL_AUTH_BYPASS_PERMISSIONS=true` skips the station, user and annotation ownership checks. These variables have no effect on Lambda.
- Station access checks are also in `api/middleware/auth.js` (`requireStationOwnerOrAdmin`, `requireStationOwnerCollaboratorOrAdmin`, `requireStationPublicOwnerCollaboratorOrAdmin`). They read `res.locals.station` and `res.locals.permissions`, which the controllers must attach first.
- `api/controllers/users.js` exports a different function that is also named `attachUser`. It loads the database user record. Check the import path to know which one a route uses.

## App

- Routes are split by area in `app/src/router/`: `index.js` (home, about, user guide, terms, annotator), `explorer.js`, `manage.js`, `admin.js` and `auth.js`.
- Views are in `app/src/views/<area>/`. Shared components are in `app/src/components/` (`charts/`, `explorer/`, `forms/`, `admin/`, `usgs/`).
- The Vuex store holds only `user` (Cognito user) and `dbUser` (database record). `app/src/events.js` is an event bus.
- `app/src/plugins/axios.js` configures the API client. `app/src/plugins/amplify.js` configures Cognito authentication.
- Environment variables read by the code: `VUE_APP_API_URL`, `VUE_APP_DATA_URL`, `VUE_APP_COGNITO_REGION`, `VUE_APP_COGNITO_USER_POOL_ID`, `VUE_APP_COGNITO_CLIENT_ID`. `app/vue.config.js` sets `VUE_APP_VERSION` from `app/package.json`. Shared values are in `app/.env`. Values for one environment are in untracked `app/.env.<mode>.local` files.

## Batch Processing and Lambda

1. The app uploads files directly to S3. Then the API submits an AWS Batch job (`JOB_QUEUE`, `JOB_DEFINITION_PROCESSOR`).
2. `batch/processor/processors/dataset.js` parses the CSV file and writes the series and values.
3. `batch/processor/processors/imageset.js` reads the EXIF data, makes thumbnails with `sharp`, and then submits a PII detection job (`JOB_DEFINITION_PII`) and sets `pii_status` to `QUEUED`.
4. The PII detector uses a different container image. Its code is not in this repository.

Lambda functions:

- `lambda/trigger/`: Cognito post-confirmation trigger. It publishes an SNS message for each new user registration.
- `lambda/worker/`: administrative tasks that the API invokes (`LAMBDA_WORKER`). The event `method` selects the task: `listS3Objects`, `deleteS3Objects` or `createAdminUser`.
- `lambda/email/`: Python. It reads photos from a mailbox and saves them to S3.
- `lambda/models/`: Python. It processes SageMaker batch transform output.

## Configuration

The root, API and CLI use `dotenv-flow`. `.env` is tracked. `.env.<NODE_ENV>.local` files are not tracked and hold secrets. Do not print or commit their values. The batch processor uses plain `dotenv` and reads `batch/processor/.env`.

Server variables read by the code: `PORT`, `REGION`, `BUCKET`, `DB_SECRET_NAME` (or the `DB_*` variables), `JOB_QUEUE`, `JOB_DEFINITION_PROCESSOR`, `JOB_DEFINITION_PII`, `LAMBDA_WORKER`, `USERPOOL_ID`, `NOTIFY_TOPIC`.
