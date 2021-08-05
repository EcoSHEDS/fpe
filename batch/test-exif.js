const ExifParser = require('exif-parser')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const advancedFormat = require('dayjs/plugin/advancedFormat')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(advancedFormat)
dayjs.tz.setDefault('UTC')

const files = [
  // filenames = EDT
  ['/Volumes/Backup Plus/fpe/MADER/BrownsBrook/20190109_20190807/20190110_1200_BrownsBrook.jpg', -4], // 13
  ['/Volumes/Backup Plus/fpe/MADER/BrownsBrook/20190109_20190807/20190801_1200_BrownsBrook.jpg', -4], // 12

  ['/Volumes/Backup Plus/fpe/MADER/TaftPond/20180613_20190519/20181230_1200_TaftPond.JPG', -4], // 13
  ['/Volumes/Backup Plus/fpe/MADER/TaftPond/20180613_20190519/20180712_1200_TaftPond.JPG', -4], // 12

  // filenames = US/Eastern
  ['/Volumes/Backup Plus/fpe/MADER/OldGristMill/20180724_20190409/20190101_1300_OldGristMill.JPG', -4], // 13
  ['/Volumes/Backup Plus/fpe/MADER/OldGristMill/20180724_20190409/20180725_1200_OldGristMill.JPG', -4], // 12

  ['/Volumes/Backup Plus/fpe/NJ/MossmansBrook/20190729_20201118/WorkingFile/20191118_1332_Mossmans Brook.jpg', -4], // 13
  ['/Volumes/Backup Plus/fpe/NJ/MossmansBrook/20190729_20201118/WorkingFile/20190731_1232_Mossmans Brook.jpg', -4] // 12
]
for (let i = 0; i < files.length; i++) {
  const [file, offset] = files[i]
  const buffer = fs.readFileSync(file)
  const parser = ExifParser.create(buffer)
  const exif = parser.enableSimpleValues(true).parse()
  // console.log(exif)
  const rawDate = new Date(exif.tags.CreateDate * 1000)
  const timestamp = dayjs(rawDate).subtract(offset, 'hour')
  const timestampUtc = dayjs.utc(rawDate).subtract(offset, 'hour')
  const timestampLocal = timestampUtc.local().tz('US/Eastern')
  // console.log(rawDate.toISOString(), timestamp.toISOString())
  console.log(
    path.basename(file).substr(0, 13),
    rawDate.toISOString(),
    timestamp.toISOString(),
    timestampUtc.toISOString(),
    timestampLocal.format('YYYY-MM-DD HH:mm:ss z')
  )
}
