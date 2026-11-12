const createError = require('http-errors')
const { getCurrentInvoke } = require('@codegenie/serverless-express')
const { isLambda } = require('../utils')

const isTrue = value => value === 'true'

const getGroups = claims => {
  if (!claims || !claims['cognito:groups']) return []
  if (Array.isArray(claims['cognito:groups'])) return claims['cognito:groups']
  return claims['cognito:groups'].split(',').map(d => d.trim()).filter(d => !!d)
}

const normalizeAuth = ({ claims, isLocal = false }) => {
  const groups = getGroups(claims)
  const isAdmin = groups.includes('admins')
  return {
    id: claims.sub,
    isAdmin,
    claims,
    isLocal
  }
}

const getAuthFromLambda = () => {
  const currentInvoke = getCurrentInvoke()
  const claims = currentInvoke &&
    currentInvoke.event &&
    currentInvoke.event.requestContext &&
    currentInvoke.event.requestContext.authorizer &&
    currentInvoke.event.requestContext.authorizer.claims
  if (!claims || !claims.sub) return null
  return normalizeAuth({ claims })
}

const getAuthFromLocalEnv = () => {
  if (isLambda()) return null
  if (!process.env.LOCAL_AUTH_USER_ID) return null

  const groups = isTrue(process.env.LOCAL_AUTH_IS_ADMIN) ? 'admins' : ''
  const claims = {
    sub: process.env.LOCAL_AUTH_USER_ID,
    'cognito:groups': groups
  }

  return normalizeAuth({ claims, isLocal: true })
}

const canBypassPermissions = () => {
  return !isLambda() && isTrue(process.env.LOCAL_AUTH_BYPASS_PERMISSIONS)
}

function attachUser (req, res, next) {
  const auth = getAuthFromLambda() || getAuthFromLocalEnv()
  if (!auth) {
    return next(createError(401, 'Unauthorized'))
  }

  req.auth = auth
  next()
}

function requireAdmin (req, res, next) {
  if (!req.auth || !req.auth.isAdmin) {
    return next(createError(401, 'Unauthorized'))
  }
  next()
}

const requireStationOwnerOrAdmin = (req, res, next) => {
  // no station
  if (!res.locals.station) {
    return next(createError(404, 'Station not found'))
  }

  // no user
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // explicit local development override
  if (canBypassPermissions()) {
    return next()
  }

  // user is not owner
  if (res.locals.station.user_id !== req.auth.id && !req.auth.isAdmin) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

const requireStationOwnerCollaboratorOrAdmin = (req, res, next) => {
  // no station
  if (!res.locals.station) {
    return next(createError(404, 'Station not found'))
  }

  // no user
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // explicit local development override
  if (canBypassPermissions()) {
    return next()
  }

  const station = res.locals.station
  const permissions = res.locals.permissions

  const isOwner = station.user_id === req.auth.id
  const isCollaborator = permissions.some(p => p.user_id === req.auth.id)
  const isAdmin = req.auth.isAdmin

  if (isOwner || isCollaborator || isAdmin) {
    return next()
  }

  return next(createError(401, 'Unauthorized'))
}

const requireStationPublicOwnerCollaboratorOrAdmin = (req, res, next) => {
  // no station
  if (!res.locals.station) {
    return next(createError(404, 'Station not found'))
  }

  // public station
  if (!res.locals.station.private) {
    return next()
  }

  // no user
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // explicit local development override
  if (canBypassPermissions()) {
    return next()
  }

  const station = res.locals.station
  const permissions = res.locals.permissions

  const isOwner = station.user_id === req.auth.id
  const isCollaborator = permissions.some(p => p.user_id === req.auth.id)
  const isAdmin = req.auth.isAdmin

  if (isOwner || isCollaborator || isAdmin) {
    return next()
  }

  return next(createError(401, 'Unauthorized'))
}

const requireUserOwnerOrAdmin = (req, res, next) => {
  // no station
  if (!res.locals.user) {
    return next(createError(404, 'User not found'))
  }

  // no user
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // explicit local development override
  if (canBypassPermissions()) {
    return next()
  }

  // user is not owner
  if (res.locals.user.user_id !== req.auth.id && !req.auth.isAdmin) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

const requireAnnotationOwnerOrAdmin = (req, res, next) => {
  // no annotation
  if (!res.locals.annotation) {
    return next(createError(404, 'Annotation not found'))
  }

  // no user
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // explicit local development override
  if (canBypassPermissions()) {
    return next()
  }

  // user is not owner
  if (res.locals.annotation.user_id !== req.auth.id && !req.auth.isAdmin) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

module.exports = {
  getAuthFromLambda,
  getAuthFromLocalEnv,
  attachUser,
  requireAdmin,
  requireStationOwnerOrAdmin,
  requireStationOwnerCollaboratorOrAdmin,
  requireStationPublicOwnerCollaboratorOrAdmin,
  requireAnnotationOwnerOrAdmin,
  requireUserOwnerOrAdmin
}
