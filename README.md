USGS Flow Photo Explorer
=========================

## Configuration

Use `.env` files specifying environment (`.env.development`, `.env.production`) and local (`.env.local`) via [`dotenv-flow`](npmjs.com/package/dotenv-flow). Local `.env` files are not tracked in the repo.

Required variables

```bash
# api server port (local development only)
PORT

# aws region
REGION

# bucket name for storing data and images
BUCKET

# database connection secret
DB_SECRETS_NAME
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
# set NODE_ENV prior to running migrations (important!)
export NODE_ENV=development
knex seed:run
```

Example datasets can be generated for existing (production) stations using the `r/scripts/export-dev-station.R` script. The output from that script can be place in the `db/seeds/development/data/users/<userId>/stations` folder to add a station and its processed datasets and imagesets to an existing user. Be sure to sync the `<station code>/storage` folder to the S3 storage bucket for development.

```sh
cd db/seeds/development/data/users/<userId>/stations/<station code>
aws s3 sync storage s3://<bucket name>/ --exclude "*" --include "imagesets/*" --include "datasets/*"
```

## API

Run development server via `nodemon`.

```bash
cd api
npm start
```

## Command Line Interface (CLI)

The `cli.js` file defines a CLI for managing the database.

To make it globally available:

```sh
npm link
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

Create a station.

```
$ fpe stations create -u 10b8ece7... -n "My Station" -l 42.123 -g -72.394
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

## AWS CLI

To manage files in S3 using the aws cli.

```bash
export BUCKET=<bucket name>

# list all files
aws s3 ls s3://${BUCKET}/ --recursive

# list dataset files
aws s3 ls s3://${BUCKET}/datasets/ --recursive

# list imageset uuids (no files)
aws s3 ls s3://${BUCKET}/imagesets/

# delete all image files for imageset uuid
aws s3 rm s3://${BUCKET}/ --recursive --exclude "*" --include "imagesets/<uuid>/*"

# delete all csv files for dataset uuid
aws s3 rm s3://${BUCKET}/ --recursive --exclude "*" --include "datasets/<uuid>/*"
```

## References

- [AWS Security Best Practices Part 2 (Uploading)](https://hedgehoglab.com/blog/aws-s3-security-best-practices-part-2)
- [robmclarty/knex-express-project-sample](https://github.com/robmclarty/knex-express-project-sample): Express + Knex template
- [Fodark/express-knex-objection](https://github.com/Fodark/express-knex-objection/blob/master/api/users.js): Express + Knex + Objection template
- [Lambda payload size workaround](https://seancoates.com/blogs/lambda-payload-size-workaround): how to deal with lambda payload limits (6 MB)

## License

The code in this repository is released to the public domain under the [CC0 1.0 Universal license](https://creativecommons.org/publicdomain/zero/1.0/). See [LICENSE](LICENSE) for details.

## Disclaimer

This software is preliminary or provisional and is subject to revision. It is being provided to meet the need for timely best science. The software has not received final approval by the U.S. Geological Survey (USGS). No warranty, expressed or implied, is made by the USGS or the U.S. Government as to the functionality of the software and related material nor shall the fact of release constitute any such warranty. The software is provided on the condition that neither the USGS nor the U.S. Government shall be held liable for any damages resulting from the authorized or unauthorized use of the software.
