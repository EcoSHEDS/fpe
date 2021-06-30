const { User } = require('../db/models')
const { printTable } = require('./lib/utils')

exports.listUsers = async function (options) {
  const rows = await User.query().orderBy('id')

  if (rows.length === 0) {
    console.log('No users found')
  } else {
    printTable(rows, ['id', 'affiliation_name', 'affiliation_description'])
  }
}

exports.createUser = async function (id, options) {
  const row = await User.query().insert({
    id,
    affiliation_name: options.affiliationName,
    affiliation_description: options.affiliationDescription
  }).returning('*')

  printTable([row], ['id', 'affiliation_name', 'affiliation_description'])
}

exports.deleteUser = async function (id) {
  const nrow = await User.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete user (id=${id})`)
    process.exit(1)
  }

  console.log(`user (id=${id}) deleted successfully`)
}
