SHEDS Flow Photo Explorer API
=============================

## Configuration

Use `.env` files with support for environment (`.env.development`, `.env.production`) and local (`.env.local`) via [`dotenv-flow`](npmjs.com/package/dotenv-flow). Local `.env` files are not tracked in the repo.

Required variables

```bash
# server port
FPE_PORT=8000

# database connection
FPE_DB_HOST=
FPE_DB_PORT=
FPE_DB_DATABASE=
FPE_DB_USER=
FPE_DB_PASSWORD=
```

## Database

The database schema is managed using [`knex` migrations and seeds]() .

### Migrations

Database migrations (`db/migrations`) keep the schema synchronized across environments.

```sh
export NODE_ENV=development # set NODE_ENV prior to running migrations (important!)
knex migrate:latest
knex migrate:rollback
knex migrate:up
knex migrate:down
knex migrate:make name_in_snake_case
```

### Seeds

Database seeds (`db/seeds/development`) populate the database with initial data (currently only used for development).

```sh
export NODE_ENV=development # set NODE_ENV prior to running migrations (important!)
knex seed:make name_in_snake_case
knex seed:run # run all
knex seed:run --sepecific my_seed.js # only one file
```

## API

Run development server via `nodemon`.

```
cd api
npm start
```

## Command Line Interface (CLI)

The `cli.js` file defines a CLI for managing the database.

To make it globally available:

```sh
yarn link
```

Be sure to set the `NODE_ENV` environmental variable.

```sh
export NODE_ENV=development
```

Now access the CLI through the `fpe` program.

```sh
fpe help
fpe stations list
```

Or for brief usage, set the `NODE_ENV` inline:

```sh
NODE_ENV=development fpe stations list
```

### CLI Quickstart

Find the id of the owner.

```
$ fpe users list
ID | EMAIL                 | FULLNAME
1  | jeff@walkerenvres.com | Jeff Walker
```

Create a station.

```
$ fpe stations create -u 1 -n "My Station" -l 42.123 -g -72.394
ID | USER_ID | NAME       | DESCRIPTION | LATITUDE | LONGITUDE
2  | 1       | My Station |             | 42.123   | -72.394
```

Create an image set for new station, and upload image files from specified folder.

```
$ fpe imagesets create cli/test/images -s 2
folder listed (n files=10)
configuration validated
processing image PICT0001.JPG (1/10)
processing image PICT0002.JPG (2/10)
processing image PICT0003.JPG (3/10)
processing image PICT0004.JPG (4/10)
processing image PICT0005.JPG (5/10)
processing image PICT0006.JPG (6/10)
processing image PICT0007.JPG (7/10)
processing image PICT0008.JPG (8/10)
processing image PICT0009.JPG (9/10)
processing image PICT0010.JPG (10/10)
images processed (n images=10)
imageset saved to db (id=11)
```

Create dataset and upload specified file.

```
$ fpe datasets create -s 1 -t datetime -v "flow_cfs"="FLOW_CFS" -v "stage_ft"="STAGE_FT" cli/test/dataset.csv
dataset parsed (n rows=6)
configuration validated
series generated (n series=2)
dataset saved to db (id=53)
```

## Cloud Storage

```
/images/<imageset.uuid>/<image.filename>
/datasets/<dataset.uuid>.csv
```

## Lambda Functions

For image processing, the `sharp` library must be compiled for linux (see [Installation for AWS Lambda](https://sharp.pixelplumbing.com/install#aws-lambda))

```
# on windows, use docker
rm -rf node_modules/sharp
docker run -v "%cd%":/var/task lambci/lambda:build-nodejs12.x npm install sharp # windows
docker run -v "$PWD$":/var/task lambci/lambda:build-nodejs12.x npm install sharp # unix

# on mac
rm -rf node_modules/sharp
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=x64 --platform=linux sharp
```

## References

- [AWS Security Best Practices Part 2 (Uploading)](https://hedgehoglab.com/blog/aws-s3-security-best-practices-part-2)
- [robmclarty/knex-express-project-sample](https://github.com/robmclarty/knex-express-project-sample): Express + Knex template
- [Fodark/express-knex-objection](https://github.com/Fodark/express-knex-objection/blob/master/api/users.js): Express + Knex + Objection template
