export function imagePiiFlag (image) {
  return (image.pii_person >= 0.2 || image.pii_vehicle >= 0.8 || image.pii_on) && !image.pii_off
}

export function fixDataUrl (url) {
  if (!process.env.VUE_APP_DATA_URL) return url

  let dataUrl = process.env.VUE_APP_DATA_URL
  if (dataUrl.endsWith('/')) {
    dataUrl = dataUrl.substring(0, dataUrl.length - 1)
  }

  const urlObj = new URL(url)
  return dataUrl + urlObj.pathname
}
