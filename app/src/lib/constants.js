export const variables = [
  {
    id: 'FLOW_CFS',
    label: 'Flow',
    units: 'cfs'
  },
  {
    id: 'STAGE_FT',
    label: 'Stage',
    units: 'ft'
  }
]

export const stationTimezones = [
  {
    id: 'US/Eastern',
    label: 'US/Eastern (UTC-5/UTC-4)'
  },
  {
    id: 'US/Central',
    label: 'US/Central (UTC-6/UTC-5)'
  },
  {
    id: 'US/Mountain',
    label: 'US/Mountain (UTC-7/UTC-6)'
  },
  {
    id: 'US/Pacific',
    label: 'US/Pacific (UTC-8/UTC-7)'
  },
  {
    id: 'US/Alaska',
    label: 'US/Alaska (UTC-9/UTC-8)'
  },
  {
    id: 'US/Hawaii',
    label: 'US/Hawaii (UTC-10/UTC-9)'
  }
]

export const utcOffsets = [
  {
    id: 'UTC-00',
    label: 'UTC-00 (GMT)',
    value: 0
  },
  {
    id: 'UTC-04',
    label: 'UTC-04 (EDT)',
    value: -4
  },
  {
    id: 'UTC-05',
    label: 'UTC-05 (EST or CDT)',
    value: -5
  },
  {
    id: 'UTC-06',
    label: 'UTC-06 (CST or MDT)',
    value: -6
  },
  {
    id: 'UTC-07',
    label: 'UTC-07 (MST or PDT)',
    value: -7
  },
  {
    id: 'UTC-08',
    label: 'UTC-08 (PST or AKDT)',
    value: -8
  },
  {
    id: 'UTC-09',
    label: 'UTC-09 (AKST or HADT)',
    value: -9
  },
  {
    id: 'UTC-10',
    label: 'UTC-10 (HAST)',
    value: -10
  }
]

// https://day.js.org/docs/en/parse/string-format
export const timestampFormats = [
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm'
]

export const MAX_IMAGES_PER_IMAGESET = 10000
