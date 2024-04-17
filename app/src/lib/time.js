import { DateTime } from 'luxon'

export function timestampFormat (v, timezone = 'local', format = 'DD ttt') {
  if (typeof v === 'string') {
    v = new Date(v)
  }
  return DateTime.fromJSDate(v).setZone(timezone).toFormat(format)
}

export function dateFormat (v, format = 'DD') {
  return DateTime.fromISO(v).toFormat(format)
}
