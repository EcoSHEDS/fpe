const BASE_URL = process.env.VUE_APP_NIMS_API_URL

async function fetchCamera (cameraId) {
  const url = new URL(`${BASE_URL}/cameras`)
  url.searchParams.set('camId', cameraId)

  const headers = {}
  if (process.env.NIMS_API_KEY) {
    headers['X-Api-Key'] = process.env.NIMS_API_KEY
  }

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`NIMS API request failed with status ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data[0] || null : null
}

module.exports = {
  fetchCamera
}
