const { DateTime, Settings } = require('luxon')
Settings.defaultZone = 'UTC'

exports.DateTime = DateTime
