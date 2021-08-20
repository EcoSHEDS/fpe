const createError = require('http-errors')

const { notify } = require('../aws')

function newAccountMessage (params) {
  const d = new Date()
  return `New account requested

Created: ${d.toLocaleString('en-US', { timeZone: 'America/New_York' })}
Name: ${params.name}
Email: ${params.email}
Affiliation: ${params.affiliation_name}
Abbreviated Affiliation: ${params.affiliation_code}
`
}

const postAccounts = async (req, res, next) => {
  try {
    notify('New Account Request', newAccountMessage(req.body))
  } catch (err) {
    console.log(err)
    throw createError(500, 'Failed to request account (server error)')
  }
  return res.status(200).json({ message: 'Account requested' })
}

module.exports = {
  postAccounts
}
