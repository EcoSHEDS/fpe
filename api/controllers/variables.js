const { Variable } = require('../db/models')

const getVariables = async (req, res, next) => {
  const rows = await Variable.query()
    .where(req.query)
  return res.status(200).json(rows)
}

module.exports = {
  getVariables
}