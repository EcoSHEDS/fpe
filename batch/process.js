const { program } = require('commander')

const { processDataset, processImageset } = require('./processors')

program.command('imageset')
  .requiredOption('-i, --id <id>', 'Imageset ID to process')
  .description('Process imageset')
  .action(processImageset)

program.command('dataset')
  .requiredOption('-i, --id <id>', 'Dataset ID to process')
  .description('Process dataset')
  .action(processDataset)

program.parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
