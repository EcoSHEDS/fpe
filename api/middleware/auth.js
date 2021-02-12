const createError = require('http-errors')

const { User } = require('../db/models')

const attachUser = async (req, res, next) => {
  const user = await User.query().findOne({ email: 'jeff@walkerenvres.com' })
  res.locals.user = user
  next()
}

const isOwner = (req, res, next) => {
  if (!res.locals.station || !res.locals.user || res.locals.station.user_id !== res.locals.user.id) {
    return next(createError(401, 'Not authorized'))
  }
  next()
}

module.exports = {
  attachUser,
  isOwner
}
