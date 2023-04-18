const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const timestamp = '2018-03-16 23:00:00'
const utcOffset = -5

const utcTimestamp = dayjs(timestamp).utc(true).subtract(utcOffset, 'hour')
const localTimestamp = utcTimestamp.add(utcOffset, 'hour')
console.log('raw:', timestamp)
console.log('utc:', utcTimestamp.toISOString())
console.log('local:', localTimestamp.utc().format('YYYY-MM-DD HH:mm'))
console.log('local date:', localTimestamp.utc().format('YYYY-MM-DD'))
