const createError = require('http-errors')

const { Image, Imageset } = require('../db/models')

const attachImage = async (req, res, next) => {
  const row = await Image.query().findById(req.params.imageId)
  if (!row) throw createError(404, `Image (id = ${req.params.imageId}) not found`)
  res.locals.image = row
  return next()
}

const postImage = async (req, res, next) => {
  const props = {
    ...req.body
  }

  const rows = await Imageset.relatedQuery('images')
    .for(res.locals.imageset.id)
    .insert([props])
    .returning('*')

  const row = rows[0]
  return res.status(201).json(row)
}

module.exports = {
  attachImage,
  postImage
}
