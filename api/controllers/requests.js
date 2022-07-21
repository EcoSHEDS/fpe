const createError = require('http-errors')

const { notify } = require('../aws')
const { Request } = require('../db/models')

function newRequestMessage (params) {
  const d = new Date()
  return `New account requested

Created: ${d.toLocaleString('en-US', { timeZone: 'America/New_York' })}
Name: ${params.name}
Email: ${params.email}
Affiliation: ${params.affiliation_name}
Abbreviation: ${params.affiliation_code}
Description: ${params.description}
`
}

function resendPasswordMessage (params) {
  const d = new Date()
  return `New temporary password requested

Created: ${d.toLocaleString('en-US', { timeZone: 'America/New_York' })}
Email: ${params.email}
`
}

const getRequests = async (req, res, next) => {
  const rows = await Request.query()
  return res.status(200).json(rows)
}

const postRequests = async (req, res, next) => {
  try {
    if (req.body.resend) {
      await notify('New Temporary Password Request', resendPasswordMessage(req.body))
      return res.status(201).json({ message: 'New temporary password requested' })
    } else {
      const row = await Request.query().insert(req.body).returning('*')
      await notify('New Account Request', newRequestMessage(req.body))
      return res.status(201).json({ message: 'Account requested', data: row })
    }
  } catch (err) {
    console.log(err)
    throw createError(500, 'Failed to request account (server error)')
  }
}

const attachRequest = async (req, res, next) => {
  const row = await Request.query()
    .findById(req.params.requestId)
  if (!row) throw createError(404, `Request (id = ${req.params.requestId}) not found`)
  res.locals.request = row
  return next()
}

const getRequest = async (req, res, next) => {
  return res.status(200).json(res.locals.request)
}

const putRequest = async (req, res, next) => {
  const row = await Request.query().patchAndFetchById(res.locals.request.id, req.body)
  return res.status(200).json(row)
}

const deleteRequest = async (req, res, next) => {
  const nrow = await Request.query().deleteById(res.locals.request.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete request (id = ${res.locals.request.id})`)
  }
  return res.status(204).json()
}

module.exports = {
  getRequests,
  postRequests,
  attachRequest,
  getRequest,
  putRequest,
  deleteRequest
}
