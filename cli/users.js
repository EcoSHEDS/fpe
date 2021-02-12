const { User } = require('../api/db/models')
const { printTable } = require('./lib/utils')

exports.listUsers = async function () {
  const rows = await User.query().orderBy('id')

  if (rows.length === 0) {
    console.log('No users found')
  } else {
    printTable(rows, ['id', 'email', 'fullname'])
  }
}
