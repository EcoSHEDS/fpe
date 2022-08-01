import * as d3 from 'd3'

export function lerp (v0, v1, t) {
  return v0 * (1 - t) + v1 * t
}

export function hasDailyValue (d, variableId) {
  return variableId && d.values && d.values[variableId] && !isNaN(d.values[variableId].mean)
}

export function hasDailyImage (d) {
  return !!d.image
}

const timestampBisector = d3.bisector(d => d.timestamp).left
export function interpolateValuesAtTimestamp (arr, x) {
  if (x.isBefore(arr[0].timestamp)) {
    return null
  } else if (x.isAfter(arr[arr.length - 1].timestamp)) {
    return null
  }

  const i = timestampBisector(arr, x)
  const a = arr[i - 1]
  const b = arr[i]

  if (!a) return null

  const t = (x.valueOf() - a.timestamp.valueOf()) /
    (b.timestamp.valueOf() - a.timestamp.valueOf())

  return lerp(a.value, b.value, t)
}

const formatMillisecond = d3.utcFormat('.%L')
const formatSecond = d3.utcFormat(':%S')
const formatMinute = d3.utcFormat('%I:%M')
const formatHour = d3.utcFormat('%I %p')
const formatDay = d3.utcFormat('%b %d')
const formatMonth = d3.utcFormat('%b')
const formatYear = d3.utcFormat('%Y')

export function timeFormat (date) {
  return (
    d3.utcSecond(date) < date
      ? formatMillisecond
      : d3.utcMinute(date) < date
        ? formatSecond
        : d3.utcHour(date) < date
          ? formatMinute
          : d3.utcDay(date) < date
            ? formatHour
            : d3.utcMonth(date) < date
              ? formatDay
              : d3.utcYear(date) < date
                ? formatMonth
                : formatYear
  )(date)
}
