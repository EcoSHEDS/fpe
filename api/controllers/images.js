const createError = require('http-errors')

const { s3 } = require('../aws')
const { Image, Imageset } = require('../db/models')

const attachImage = async (req, res, next) => {
  const row = await Image.query().findById(req.params.imageId)
  if (!row) throw createError(404, `Image (id = ${req.params.imageId}) not found`)
  res.locals.image = row
  return next()
}

const getImage = async (req, res, next) => {
  return res.status(200).json(res.locals.image)
}

const getImages = async (req, res, next) => {
  const rows = await res.locals.imageset.$relatedQuery('images')
    .modify('defaultOrderBy')
    .modify('defaultSelect')
    .modify('excludePii')
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

const putImage = async (req, res, next) => {
  const row = await Image.query()
    .patchAndFetchById(res.locals.image.id, req.body)
  return res.status(200).json(row)
}

const deleteImage = async (req, res, next) => {
  const nrow = await Image.query().deleteById(res.locals.image.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete image (id=${res.locals.image.id})`)
  }

  await deleteImageFiles(res.locals.image)

  return res.status(204).json()
}

const deleteImageFiles = async (image) => {
  try {
    await s3.deleteObject(image.full_s3).promise()
    await s3.deleteObject(image.thumb_s3).promise()
  } catch (err) {
    console.log(`Failed to delete image files on s3 (id=${image.id})`)
    console.error(err)
  }
}

module.exports = {
  attachImage,
  getImages,
  getImage,
  putImage,
  postImage,
  deleteImage
}
