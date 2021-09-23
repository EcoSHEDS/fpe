const { Account } = require('../../db/models')

async function getAccountRequests (req, res, next) {
  const rows = await Account.query()
  return res.status(200).json(rows)
}

module.exports = {
  getAccountRequests
}
