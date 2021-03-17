const { program } = require('commander')

const { processDataset, processImageset } = require('./processors')

program.command('imageset [id]')
  .description('Process imageset')
  .action(processImageset)

program.command('dataset [id]')
  .option('-d, --dry-run', 'dry run')
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
