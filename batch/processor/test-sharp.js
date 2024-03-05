// const ExifParser = require('exif-parser')
const sharp = require('sharp')

async function run (filename, output) {
  let image = await sharp(filename)
  let metadata = await image.metadata()
  // const exif = ExifParser.create(metadata.exif).parse()
  console.log(filename)
  console.log(metadata)
  const buffer = await image.rotate().toBuffer()
  metadata = await sharp(buffer).metadata()
  console.log(metadata)
  // return await image.rotate().toFile(output)
}

run('data/sawmill.jpg', 'data/sawmill-rotate.jpg')
// run('data/westbrook.jpg', 'data/westbrook-rotate.jpg')
