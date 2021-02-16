const createError = require('http-errors')

const attachUser = async (req, res, next) => {
  res.locals.userId = null

  if (!req.apiGateway) {
    res.locals.userId = 'local'
    return next()
  }

  console.log(req.apiGateway.event.requestContext)
  if (req.apiGateway.event.requestContext.authorizer &&
    req.apiGateway.event.requestContext.authorizer.claims.sub) {
    res.locals.userId = req.apiGateway.event.requestContext.authorizer.claims.sub
  }

  next()
}

const isOwner = (req, res, next) => {
  if (!res.locals.station ||
    !res.locals.userId ||
    res.locals.station.user_id !== res.locals.userId) {
    return next(createError(401, 'Not authorized'))
  }
  next()
}

module.exports = {
  attachUser,
  isOwner
}
