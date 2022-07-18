# Flow Photo Explorer Application

## Project Setup

### Dependencies

Install node.js dependencies

```sh
npm install
```

### Configuration

Configure the application using `.env` files per vue cli [Configuration Reference](https://cli.vuejs.org/config/). All variables should be defined using local files (e.g. `.env.*.local` ), which are not tracked by git.

See `.env` for list of required variables.

## Development

Start development server, then navigate to http://localhost:8080

```sh
npm run serve
```

## Production

## Staging Build

Build for staging

```sh
npm run stage
```

## Production Build

Build for production

```
npm run build
```

## Deploy

Copy contents of `dist/` to remote server or s3 bucket.

```sh
aws s3 sync dist/ s3://<STORAGE_BUCKET>/apps/ecosheds/fpe --delete
```
