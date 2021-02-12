const columnify = require('columnify')

function printTable (data, columns, options) {
  const table = columnify(data, {
    ...options,
    columns,
    columnSplitter: ' | '
  })
  console.log(table)
}

module.exports = {
  printTable
}
