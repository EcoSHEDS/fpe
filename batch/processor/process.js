const { program } = require('commander')

const { processDatasets, processImageset } = require('./processors')

program.command('imageset <id>')
  .option('-d, --dry-run', 'dry run')
  .option('-r, --rotate-only', 'rotate only')
  .description('Process imageset')
  .action(processImageset)

program.command('dataset [ids...]')
  .option('-a, --all', 'Process all datasets with status=CREATED')
  .option('-d, --dry-run', 'dry run')
  .description('Process datasets')
  .action(processDatasets)

program.parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
