const createError = require('http-errors')
const { CognitoIdentityServiceProvider } = require('aws-sdk')

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  region: process.env.REGION
})
const userPoolId = process.env.USERPOOL_ID

const knex = require('../db/knex')
const { deleteDatasetFiles } = require('./datasets')
const { deleteImagesetFiles } = require('./imagesets')
const { Station, Model, User, StationPermission } = require('../db/models')

const stationsQuery = function () {
  return Station.query()
    .select('stations.*', 'user.affiliation_code', 'user.affiliation_name', 'i.images', 'v.variables')
    .leftJoinRelated('user')
    .withGraphFetched('[models]')
    .leftJoin(
      knex.raw('stations_summary_images as i'),
      'stations.id',
      'i.station_id'
    )
    .leftJoin(
      knex.raw('stations_summary_variables as v'),
      'stations.id',
      'v.station_id'
    )
}

const attachStation = async (req, res, next) => {
  const row = await Station.query()
    .findById(req.params.stationId)
    .select('stations.*', 'user.affiliation_code', 'user.affiliation_name')
    .leftJoinRelated('user')
    .withGraphFetched('[models]')

  if (!row) throw createError(404, `Station (id = ${req.params.stationId}) not found`)

  const permissions = await StationPermission.query()
    .where({ station_id: row.id })
    .withGraphFetched('user')

  res.locals.station = row
  res.locals.permissions = permissions
  return next()
}

const getPublicStations = async (req, res, next) => {
  const rows = await stationsQuery()
    .where(req.query)
    .andWhere('private', false)
  return res.status(200).json(rows)
}

const getAllStations = async (req, res, next) => {
  const rows = await stationsQuery()
    .where(req.query)
  return res.status(200).json(rows)
}

const postStations = async (req, res, next) => {
  const existing = await Station.query()
    .where('user_id', req.auth.id)
    .where('name', req.body.name)
  if (existing.length > 0) {
    return res.status(400).json({
      message: `Station names must be unique. "${req.body.name}" already exists.`
    })
  }
  const payload = { ...req.body, user_id: req.auth.id }
  const row = await Station.query().insert(payload).returning('*')
  return res.status(201).json(row)
}

const getStation = async (req, res, next) => {
  const results = await knex.raw(
    'select * from f_station_summary(?)',
    [res.locals.station.id]
  )
  delete res.locals.station.datasets
  delete res.locals.station.imagesets
  res.locals.station.summary = results.rows[0]
  return res.status(200).json(res.locals.station)
}

const putStation = async (req, res, next) => {
  if (req.body.name) {
    const existing = await Station.query()
      .where('user_id', res.locals.station.user_id)
      .where('name', req.body.name)
    if (existing.length > 0 && existing[0].id !== res.locals.station.id) {
      return res.status(400).json({
        message: `Station names must be unique. "${req.body.name}" already exists.`
      })
    }
  }
  if (req.body.user_id && req.body.user_id !== res.locals.station.user_id) {
    return res.status(400).json({
      message: 'Station owner cannot be changed'
    })
  }
  const row = await Station.query().patchAndFetchById(res.locals.station.id, req.body)
  return res.status(200).json(row)
}

const deleteStation = async (req, res, next) => {
  const nrow = await Station.query().deleteById(res.locals.station.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete station (id = ${res.locals.station.id})`)
  }

  await deleteStationFiles(res.locals.station)

  return res.status(204).json()
}

const deleteStationFiles = async ({ datasets, imagesets }) => {
  if (datasets) {
    for (let i = 0; i < datasets.length; i++) {
      await deleteDatasetFiles(datasets[i])
    }
  }
  if (imagesets) {
    for (let i = 0; i < imagesets.length; i++) {
      await deleteImagesetFiles(imagesets[i])
    }
  }
}

const getStationDaily = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_daily(?)',
    [res.locals.station.id]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationDailyValues = async (req, res, next) => {
  const variableId = req.query.variableId
  if (!variableId) throw createError(400, 'Query parameter \'variableId\' missing')
  const start = req.query.start
  if (!start) throw createError(400, 'Query parameter \'start\' missing')
  const end = req.query.end
  if (!end) throw createError(400, 'Query parameter \'end\' missing')
  const result = await knex.raw(
    'select * from f_station_daily_values_variable(?, ?, ?, ?)',
    [res.locals.station.id, variableId, start, end]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationDailyImages = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_daily_images(?)',
    [res.locals.station.id]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationImages = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_images(?,?,?)',
    [res.locals.station.id, req.query.start, req.query.end]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationValues = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_values(?,?,?,?)',
    [res.locals.station.id, req.query.variable, req.query.start, req.query.end]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationRandomImagePairs = async (req, res, next) => {
  const nPairs = Math.min(parseInt(req.query.n_pairs) || 100, 10000)
  const minHour = parseInt(req.query.min_hour) || 7
  const maxHour = parseInt(req.query.max_hour) || 18
  const minDate = req.query.min_date || '2000-01-01'
  const maxDate = req.query.max_date || '2099-12-31'
  const args = [res.locals.station.id, nPairs, minHour, maxHour, minDate, maxDate]

  const result = await knex.raw(
    'select * from f_station_random_image_pairs(?,?,?,?,?,?)',
    args
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationModels = async (req, res, next) => {
  const rows = await Model.query()
    .select('*')
    .where('station_id', res.locals.station.id)
  return res.status(200).json(rows)
}

async function getStationPermissions(req, res) {
  const permissions = await StationPermission.query()
    .where({ station_id: res.locals.station.id })
    .withGraphFetched('user')

  // Fetch Cognito user details for each permission
  const enhancedPermissions = await Promise.all(permissions.map(async (permission) => {
    try {
      const params = {
        UserPoolId: userPoolId,
        Username: permission.user_id
      }
      const cognitoUser = await cognitoIdentityServiceProvider.adminGetUser(params).promise()

      const nameAttribute = cognitoUser.UserAttributes.find(attr => attr.Name === 'name')
      const emailAttribute = cognitoUser.UserAttributes.find(attr => attr.Name === 'email')

      return {
        id: permission.id,
        station_id: permission.station_id,
        user_id: permission.user_id,
        user: {
          id: permission.user.id,
          name: nameAttribute ? nameAttribute.Value : '',
          email: emailAttribute ? emailAttribute.Value : '',
          affiliation_code: permission.user.affiliation_code,
          affiliation_name: permission.user.affiliation_name
        }
      }
    } catch (error) {
      console.error(`Error fetching Cognito user for ${permission.user_id}:`, error)
      return res.status(500).json({ message: 'Error fetching user' })
    }
  }))

  res.json(enhancedPermissions)
}

addUserPermission = async (req, res) => {
  const { station } = res.locals
  const { userEmail } = req.body

  // Step 1: Find user in Cognito
  let cognitoUser
  try {
    const params = {
      UserPoolId: userPoolId,
      Filter: `email = "${userEmail}"`,
      Limit: 1
    }
    const result = await cognitoIdentityServiceProvider.listUsers(params).promise()
    cognitoUser = result.Users[0]
  } catch (error) {
    console.error('Error finding user in Cognito:', error)
    return res.status(500).json({ message: 'Error finding user in authentication service' })
  }

  if (!cognitoUser) {
    return res.status(404).json({ message: 'User not found' })
  }

  const cognitoUserId = cognitoUser.Username

  // Step 2: Check if user exists in database
  const dbUser = await User.query().findById(cognitoUserId)
  if (!dbUser) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Step 3: Check if permission already exists
  const existingPermission = await StationPermission.query()
    .where({ station_id: station.id, user_id: cognitoUserId })
    .first()

  if (existingPermission) {
    return res.status(400).json({ message: 'User already has permission for this station' })
  }

  // Step 3.5: Check if the user is already the station owner
  if (station.user_id === cognitoUserId) {
    return res.status(400).json({ message: 'User is already the station owner, no additional permission needed' })
  }

  // Step 4: Add permission
  try {
    await StationPermission.query().insert({
      station_id: station.id,
      user_id: cognitoUserId
    })
  } catch (error) {
    console.error('Error adding user permission:', error)
    return res.status(500).json({ message: 'Error adding user permission' })
  }

  res.status(201).json({ message: 'User permission added successfully' })
}

removeUserPermission = async (req, res) => {
  const { userId } = req.params

  const deletedRows = await StationPermission.query()
    .delete()
    .where({ station_id: res.locals.station.id, user_id: userId })

  if (deletedRows === 0) {
    return res.status(404).json({ message: 'User permission not found for this station' })
  }

  res.status(200).json({ message: 'User permission removed successfully' })
}

module.exports = {
  getPublicStations,
  getAllStations,
  postStations,

  attachStation,
  getStation,
  putStation,
  deleteStation,

  getStationImages,
  getStationValues,

  getStationDaily,
  getStationDailyValues,
  getStationDailyImages,

  getStationModels,

  getStationRandomImagePairs,

  stationsQuery,

  addUserPermission,
  removeUserPermission,
  getStationPermissions
}
