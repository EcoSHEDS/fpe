SHEDS Flow Photo Explorer API
=============================

[https://github.com/robmclarty/knex-express-project-sample](https://github.com/robmclarty/knex-express-project-sample)

# Configuration

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

# Database

The database schema is managed using [`knex` migrations and seeds]() .

## Migrations

Database migrations (`db/migrations`) keep the schema synchronized across environments.

```sh
export NODE_ENV=development # set NODE_ENV prior to running migrations (important!)
knex migrate:latest
knex migrate:rollback
knex migrate:up
knex migrate:down
knex migrate:make name_in_snake_case
```

## Seeds

Database seeds (`db/seeds/development`) populate the database with initial data (currently only used for development).

```sh
export NODE_ENV=development # set NODE_ENV prior to running migrations (important!)
knex seed:make name_in_snake_case
knex seed:run # run all
knex seed:run --sepecific my_seed.js # only one file
```

# API

Run development server via `nodemon`.

```
yarn dev
```

# CLI

The `cli.js` file defines a CLI for managing the database.

To make it globally available:

```sh
yarn link
```

Be sure to set the `NODE_ENV` environmental variable.

```sh
export NODE_ENV=development
```

Now access the CLI through the `fpe-api` program.

```sh
fpe-api help
fpe-api stations list
```

Or for brief usage, set the `NODE_ENV` inline:

```sh
NODE_ENV=development fpe-api stations list
```

# References:

- [Fodark/express-knex-objection](https://github.com/Fodark/express-knex-objection/blob/master/api/users.js): Express + Knex + Objection template
