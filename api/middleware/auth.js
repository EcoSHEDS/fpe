const createError = require('http-errors')

const { isLambda } = require('../utils')

function attachUser (req, res, next) {
  if (!isLambda()) {
    if (!req.query.userId) {
      return next(createError(401, 'Unauthorized'))
    }
    res.locals.user = {
      id: req.query.userId,
      isAdmin: req.query.isAdmin === 'true',
      claims: {}
    }
    return next()
  }
  if (!req.apiGateway.event.requestContext.authorizer) {
    return next(createError(401, 'Unauthorized'))
  }
  const claims = req.apiGateway.event.requestContext.authorizer.claims
  const groups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : []
  const isAdmin = groups.includes('admins')
  res.locals.user = {
    id: claims.sub,
    isAdmin,
    claims
  }
  next()
}

// const attachUser = async (req, res, next) => {
//   res.locals.userId = null

//   if (!req.apiGateway) {
//     res.locals.userId = 'local'
//     return next()
//   }

//   if (req.apiGateway.event.requestContext.authorizer &&
//     req.apiGateway.event.requestContext.authorizer.claims.sub) {
//     res.locals.userId = req.apiGateway.event.requestContext.authorizer.claims.sub
//   }

//   next()
// }

const requireStationOwnerOrAdmin = (req, res, next) => {
  if (!res.locals.station) {
    // no station
    return next(createError(404, 'Station not found'))
  }

  if (!res.locals.user) {
    // no user
    return next(createError(401, 'Unauthorized'))
  }

  if (res.locals.station.user_id !== res.locals.user.id && !res.locals.user.isAdmin) {
    // user is not owner
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

module.exports = {
  attachUser,
  requireStationOwnerOrAdmin
}
