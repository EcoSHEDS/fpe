const { User } = require('../api/db/models')
const { fw } = require('./lib/utils')

exports.listUsers = async function () {
  console.log(`
List users
  `)
  const rows = await User.query().orderBy('id')

  if (rows.length === 0) {
    console.log('No users found')
  } else {
    console.log('  id |                    email |                 fullname')
    console.log('-----|--------------------------|-------------------------')
    rows.forEach(row => console.log(`${fw(row.id, 4)} | ${fw(row.email, 24)} | ${fw(row.fullname, 24)}`))
  }
}
