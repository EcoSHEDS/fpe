const makeError = require('make-error')

const DatasetConfigurationError = makeError('DatasetConfigurationError')
const NotFoundError = makeError('NotFoundError')

module.exports = {
  DatasetConfigurationError,
  NotFoundError
}
