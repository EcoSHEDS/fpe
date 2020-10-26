const { User } = require('../db/models')

const attachUser = async (req, res, next) => {
  const user = await User.query().findOne({ email: 'jeff@walkerenvres.com' })
  res.locals.user = user
  next()
}

module.exports = {
  attachUser
}
