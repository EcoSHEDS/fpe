#!/usr/bin/env node

const { program } = require('commander')

const { listUsers, createUser, deleteUser } = require('./users')
const { listStations, createStation, deleteStation } = require('./stations')
const { listDatasets, createDataset, processDataset, deleteDataset } = require('./datasets')
const { listImagesets, createImageset, processImageset, deleteImageset } = require('./imagesets')

const { collect } = require('./lib/utils')

// USERS
const users = program.command('users').description('Manage users')

users
  .command('list')
  .description('List users')
  .action(listUsers)

users
  .command('create <id>')
  .requiredOption('-c, --affiliationCode <text>', 'Affiliation code')
  .requiredOption('-n, --affiliationName <text>', 'Affiliation full name')
  .description('Create a new database user')
  .action(createUser)

users
  .command('delete <id>')
  .description('Delete a user')
  .action(deleteUser)

// STATIONS
const stations = program.command('stations').description('Manage stations')

stations
  .command('list')
  .option('-u, --user <id>', 'Only list stations for this user ID')
  .description('List stations')
  .action(listStations)

stations
  .command('create')
  .requiredOption('-u, --user <id>', 'User ID that will own this station')
  .requiredOption('-n, --stationName <text>', 'Station name')
  .requiredOption('-l, --latitude <float>', 'Latitude in decimal degrees')
  .requiredOption('-g, --longitude <float>', 'Longitude in decimal degrees')
  .description('Create a new station')
  .action(createStation)

stations
  .command('delete <id>')
  .description('Delete a station')
  .action(deleteStation)

// DATASETS
const datasets = program.command('datasets').description('Manage datasets')

datasets
  .command('list')
  .option('-s, --station <id>', 'Only list datasets for this station ID')
  .description('List datasets')
  .action(listDatasets)

datasets
  .command('create <file>')
  .requiredOption('-s, --station <id>', 'Station ID associated with this dataset')
  .requiredOption('-t, --timestamp <column>', 'Timestamp columns name')
  .requiredOption('-v, --variable <column=variable.id>', 'Variable column mapping ("column name"="variable id")', collect, [])
  .option('-d, --dry-run', 'Dry run (nothing saved to database)', false)
  .description('Create a new dataset')
  .action(createDataset)

datasets
  .command('process <id>')
  .description('Process a dataset')
  .action(processDataset)

datasets
  .command('delete <id>')
  .description('Delete a dataset')
  .action(deleteDataset)

// IMAGESETS
const imagesets = program.command('imagesets').description('Manage imagesets')

imagesets
  .command('list')
  .option('-s, --station <id>', 'Only list imagesets for this station ID')
  .description('List imagesets')
  .action(listImagesets)

imagesets
  .command('create <folder>')
  .requiredOption('-s, --station <id>', 'Station ID associated with this imageset')
  .option('-d, --dry-run', 'Dry run (nothing saved to database)', false)
  .description('Create a new imageset')
  .action(createImageset)

imagesets
  .command('process <id>')
  .description('Process an imageset')
  .action(processImageset)

imagesets
  .command('delete <id>')
  .description('Delete an imageset')
  .action(deleteImageset)

// RUN
program.parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
