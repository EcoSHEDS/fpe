const createError = require('http-errors')

const { Image, Imageset } = require('../db/models')

const attachImage = async (req, res, next) => {
  const row = await Image.query().findById(req.params.imageId)
  if (!row) throw createError(404, `Image (id = ${req.params.imageId}) not found`)
  res.locals.image = row
  return next()
}

const getImages = async (req, res, next) => {
  const rows = await res.locals.imageset.$relatedQuery('images')
    .modify('defaultOrderBy')
    .modify('defaultSelect')
  return res.status(200).json(rows)
}

const postImage = async (req, res, next) => {
  const props = {
    ...req.body,
    status: 'CREATED'
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
  getImages,
  postImage
}
