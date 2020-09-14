#!/usr/bin/env node

const { program } = require('commander')

const { listUsers } = require('./cli/users')
const { listCameras, createCamera, deleteCamera } = require('./cli/cameras')
const { listStations, createStation, deleteStation } = require('./cli/stations')
const { listDatasets, createDataset, deleteDataset } = require('./cli/datasets')
const { listImagesets, createImageset, deleteImageset } = require('./cli/imagesets')

const { collect } = require('./cli/lib/utils')

const users = program.command('users').description('Manage users')

users
  .command('list')
  .description('List users')
  .action(listUsers)

const cameras = program.command('cameras').description('Manage cameras')

cameras
  .command('list')
  .option('-u, --user <id>', 'Only list cameras for this user ID')
  .description('List cameras')
  .action(listCameras)

cameras
  .command('create')
  .requiredOption('-u, --user <id>', 'User ID that will own this camera')
  .requiredOption('-n, --cameraName <text>', 'Camera name')
  .requiredOption('-m, --make <text>', 'Make/model')
  .requiredOption('-s, --serial <text>', 'Serial number')
  .description('Create a new camera')
  .action(createCamera)

cameras
  .command('delete <id>')
  .description('Delete a dataset')
  .action(deleteCamera)

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
  .description('Delete a dataset')
  .action(deleteStation)

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
  .command('delete <id>')
  .description('Delete a dataset')
  .action(deleteDataset)

const imagesets = program.command('imagesets').description('Manage imagesets')

imagesets
  .command('list')
  .option('-s, --station <id>', 'Only list imagesets for this station ID')
  .description('List imagesets')
  .action(listImagesets)

imagesets
  .command('create <folder>')
  .requiredOption('-s, --station <id>', 'Station ID associated with this imageset')
  .requiredOption('-c, --camera <id>', 'Camera ID associated with this imageset')
  .option('-d, --dry-run', 'Dry run (nothing saved to database)', false)
  .description('Create a new imageset')
  .action(createImageset)

imagesets
  .command('delete <id>')
  .description('Delete an imageset')
  .action(deleteImageset)

program.parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
