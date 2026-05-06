import axios from 'axios'
import { ascending, rollup } from 'd3-array'
import { DateTime } from 'luxon'

const BASE_URL = 'https://api.waterdata.usgs.gov/nims/v0'
const DEFAULT_LIMIT = 10000

const cameraCache = new Map()
const filesCache = new Map()

function getHeaders () {
  return process.env.VUE_APP_NIMS_API_KEY
    ? { 'X-Api-Key': process.env.VUE_APP_NIMS_API_KEY }
    : {}
}

function normalizeTimezone (timezone) {
  if (timezone === 'US/Eastern') return 'America/New_York'
  return timezone || 'UTC'
}

function parseTimestamp (timestamp) {
  const iso = timestamp.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z')
  return DateTime.fromISO(iso, { zone: 'UTC' })
}

function isNimsStation (station) {
  return !!(station && station.nims_camera_id)
}

function getCameraId (stationOrCameraId) {
  if (typeof stationOrCameraId === 'string') return stationOrCameraId.trim()
  if (stationOrCameraId && stationOrCameraId.nims_camera_id) {
    return stationOrCameraId.nims_camera_id.trim()
  }
  return null
}

async function fetchCamera (stationOrCameraId) {
  const cameraId = getCameraId(stationOrCameraId)
  if (!cameraId) throw new Error('NIMS camera ID is required')
  if (cameraCache.has(cameraId)) return cameraCache.get(cameraId)

  const response = await axios.get(`${BASE_URL}/cameras`, {
    headers: getHeaders(),
    params: {
      camId: cameraId
    }
  })
  const camera = response.data && response.data[0]
  if (!camera) throw new Error(`NIMS camera not found (${cameraId})`)

  const normalizedCamera = {
    ...camera,
    timezone: normalizeTimezone(camera.tz)
  }
  cameraCache.set(cameraId, normalizedCamera)
  return normalizedCamera
}

async function fetchFilesPage (stationOrCameraId, { after, before, recent = true, limit = DEFAULT_LIMIT } = {}) {
  const cameraId = getCameraId(stationOrCameraId)
  if (!cameraId) throw new Error('NIMS camera ID is required')

  const params = {
    camId: cameraId,
    rawItem: true,
    recent,
    limit
  }
  if (after) params.after = after
  if (before) params.before = before

  const response = await axios.get(`${BASE_URL}/listFiles`, {
    headers: getHeaders(),
    params
  })
  return response.data || []
}

async function fetchFiles (stationOrCameraId, options = {}) {
  return fetchFilesPage(stationOrCameraId, options)
}

async function fetchAllFiles (stationOrCameraId) {
  const cameraId = getCameraId(stationOrCameraId)
  if (!cameraId) throw new Error('NIMS camera ID is required')
  if (filesCache.has(cameraId)) return filesCache.get(cameraId)

  const seen = new Set()
  const rows = []
  let before = null
  let hasMore = true

  while (hasMore) {
    const page = await fetchFilesPage(cameraId, {
      before,
      recent: true,
      limit: DEFAULT_LIMIT
    })

    page.forEach(row => {
      const key = `${row.camId}:${row.filename}`
      if (!seen.has(key)) {
        seen.add(key)
        rows.push(row)
      }
    })

    hasMore = page.length === DEFAULT_LIMIT
    if (hasMore) {
      const oldest = page.reduce((min, row) => {
        const timestamp = parseTimestamp(row.timestamp)
        return !min || timestamp < min ? timestamp : min
      }, null)
      before = oldest.minus({ milliseconds: 1 }).toUTC().toISO()
    }
  }

  const files = rows.sort((a, b) => ascending(parseTimestamp(a.timestamp), parseTimestamp(b.timestamp)))
  filesCache.set(cameraId, files)
  return files
}

function getFileDate (file, timezone) {
  return parseTimestamp(file.timestamp).setZone(timezone).toISODate()
}

function fileToImage (file, camera) {
  const timestamp = parseTimestamp(file.timestamp)
  const url = `${camera.smallDir}${file.filename}`
  return {
    id: `nims:${file.camId}:${file.timestamp}`,
    filename: file.filename,
    timestamp: timestamp.toJSDate(),
    thumb_url: url,
    full_url: url
  }
}

function summarizeFiles (files, timezone) {
  if (!files || files.length === 0) {
    return {
      start_date: null,
      end_date: null,
      count: 0
    }
  }

  const dates = files.map(file => getFileDate(file, timezone)).sort()
  return {
    start_date: dates[0],
    end_date: dates[dates.length - 1],
    count: files.length
  }
}

async function getImageSummary (stationOrCameraId) {
  const camera = await fetchCamera(stationOrCameraId)
  const files = await fetchAllFiles(stationOrCameraId)
  return summarizeFiles(files, camera.timezone)
}

async function getDailyImages (stationOrCameraId) {
  const camera = await fetchCamera(stationOrCameraId)
  const files = await fetchAllFiles(stationOrCameraId)
  const timezone = camera.timezone
  const noonByDate = rollup(files, values => {
    const noon = DateTime.fromISO(getFileDate(values[0], timezone), { zone: timezone }).set({ hour: 12 })
    const image = values.reduce((closest, file) => {
      const distance = Math.abs(parseTimestamp(file.timestamp).setZone(timezone).diff(noon).as('milliseconds'))
      if (!closest || distance < closest.distance) return { file, distance }
      return closest
    }, null).file

    return {
      date: getFileDate(image, timezone),
      n_images: values.length,
      image: fileToImage(image, camera)
    }
  }, file => getFileDate(file, timezone))

  return Array.from(noonByDate.values()).sort((a, b) => ascending(a.date, b.date))
}

async function getImages (stationOrCameraId, startDate, endDate) {
  const camera = await fetchCamera(stationOrCameraId)
  const files = await fetchAllFiles(stationOrCameraId)
  const timezone = camera.timezone
  const endExclusive = DateTime.fromISO(endDate, { zone: timezone })

  return files
    .filter(file => {
      const date = getFileDate(file, timezone)
      return date >= startDate && DateTime.fromISO(date, { zone: timezone }) < endExclusive
    })
    .map(file => fileToImage(file, camera))
}

export default {
  normalizeTimezone,
  fetchCamera,
  fetchFiles,
  fetchAllFiles,
  parseTimestamp,
  fileToImage,
  getImageSummary,
  getDailyImages,
  getImages,
  isNimsStation,
  getCameraId
}
