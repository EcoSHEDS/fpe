const createError = require('http-errors')

const { notify } = require('../aws')
const { Account } = require('../db/models')

function newAccountMessage (params) {
  const d = new Date()
  return `New account requested

Created: ${d.toLocaleString('en-US', { timeZone: 'America/New_York' })}
Name: ${params.name}
Email: ${params.email}
Affiliation: ${params.affiliation_name}
Abbreviation: ${params.affiliation_code}
`
}

const postAccounts = async (req, res, next) => {
  try {
    const row = await Account.query().insert(req.body).returning('*')
    await notify('New Account Request', newAccountMessage(req.body))
    return res.status(201).json({ message: 'Account requested', data: row })
  } catch (err) {
    console.log(err)
    throw createError(500, 'Failed to request account (server error)')
  }
}

module.exports = {
  postAccounts
}
