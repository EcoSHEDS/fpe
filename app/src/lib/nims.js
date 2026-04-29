import axios from 'axios'
import { ascending, rollup } from 'd3-array'
import { DateTime } from 'luxon'

const BASE_URL = 'https://api.waterdata.usgs.gov/nims/v0'
const CAM_ID = 'MA_West_Branch_Farmington_River_near_New_Boston'
const STATION_ID = `nims:${CAM_ID}`
const DEFAULT_LIMIT = 10000

let cameraCache = null
let filesCache = null

function normalizeTimezone (timezone) {
  if (timezone === 'US/Eastern') return 'America/New_York'
  return timezone || 'UTC'
}

function parseTimestamp (timestamp) {
  const iso = timestamp.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z')
  return DateTime.fromISO(iso, { zone: 'UTC' })
}

function isNimsStationId (id) {
  return typeof id === 'string' && id.startsWith('nims:')
}

function getCamIdFromStationId (id) {
  return isNimsStationId(id) ? id.replace(/^nims:/, '') : null
}

async function fetchCamera () {
  if (cameraCache) return cameraCache

  const response = await axios.get(`${BASE_URL}/cameras`, {
    params: {
      camId: CAM_ID
    }
  })
  const camera = response.data && response.data[0]
  if (!camera) throw new Error(`NIMS camera not found (${CAM_ID})`)

  cameraCache = {
    ...camera,
    timezone: normalizeTimezone(camera.tz)
  }
  return cameraCache
}

async function fetchFilesPage ({ after, before, recent = true, limit = DEFAULT_LIMIT } = {}) {
  const params = {
    camId: CAM_ID,
    rawItem: true,
    recent,
    limit
  }
  if (after) params.after = after
  if (before) params.before = before

  const response = await axios.get(`${BASE_URL}/listFiles`, { params })
  return response.data || []
}

async function fetchFiles (options = {}) {
  return fetchFilesPage(options)
}

async function fetchAllFiles () {
  if (filesCache) return filesCache

  const seen = new Set()
  const rows = []
  let before = null
  let hasMore = true

  while (hasMore) {
    const page = await fetchFilesPage({
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

  filesCache = rows.sort((a, b) => ascending(parseTimestamp(a.timestamp), parseTimestamp(b.timestamp)))
  return filesCache
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

async function getImageSummary () {
  const camera = await fetchCamera()
  const files = await fetchAllFiles()
  return summarizeFiles(files, camera.timezone)
}

function cameraToStation (camera, imageSummary = { start_date: null, end_date: null, count: 0 }) {
  return {
    id: STATION_ID,
    user_id: null,
    name: camera.camName,
    description: camera.camDesc,
    latitude: Number(camera.lat),
    longitude: Number(camera.lng),
    timezone: camera.timezone,
    metadata: {
      imageset: {
        useAffiliation: false,
        source: 'USGS National Imagery Management System',
        methodology: 'Images are loaded directly from the USGS National Imagery Management System (NIMS) API for this proof of concept.',
        citation: 'USGS National Imagery Management System. https://api.waterdata.usgs.gov/docs/nims'
      }
    },
    created_at: camera.createdDate,
    updated_at: camera.modifiedDate,
    private: false,
    nwis_id: camera.nwisId,
    waterbody_type: 'ST',
    status: 'ACTIVE',
    annotation_priority: false,
    affiliation_code: 'USGS NIMS',
    affiliation_name: 'USGS National Imagery Management System',
    images: imageSummary,
    variables: [],
    models: [],
    has_obs: !!camera.nwisId,
    has_model: false,
    demo_order: 0,
    nims: {
      camId: camera.camId,
      smallDir: camera.smallDir,
      thumbDir: camera.thumbDir,
      overlayDir: camera.overlayDir,
      tlDir: camera.tlDir
    },
    summary: {
      images: imageSummary,
      values: {
        count: 0,
        variables: []
      }
    }
  }
}

async function getStation () {
  const camera = await fetchCamera()
  const imageSummary = await getImageSummary()
  return cameraToStation(camera, imageSummary)
}

async function getDailyImages () {
  const camera = await fetchCamera()
  const files = await fetchAllFiles()
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

async function getImages (startDate, endDate) {
  const camera = await fetchCamera()
  const files = await fetchAllFiles()
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
  CAM_ID,
  STATION_ID,
  fetchCamera,
  fetchFiles,
  fetchAllFiles,
  getStation,
  getDailyImages,
  getImages,
  isNimsStationId,
  getCamIdFromStationId
}
