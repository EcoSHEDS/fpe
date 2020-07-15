const { Dataset } = require('../../db/models')

const getDatasets = async (req, res, next) => {
  const rows = await Dataset.query().where(req.query).withGraphFetched('station')
  return res.status(200).json(rows)
}

module.exports = {
  getDatasets
}
