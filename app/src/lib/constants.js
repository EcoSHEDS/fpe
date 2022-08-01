export const variables = [
  {
    id: 'FLOW_CFS',
    label: 'Flow',
    units: 'cfs',
    unitOptions: [
      {
        id: 'CFS',
        label: 'cfs (ft3/sec)',
        scale: 1,
        offset: 0
      },
      {
        id: 'MPS',
        label: 'cms (m3/sec)',
        scale: Math.pow(0.3048, 3),
        offset: 0
      }
    ]
  },
  {
    id: 'STAGE_FT',
    label: 'Stage',
    units: 'ft',
    unitOptions: [
      {
        id: 'FT',
        label: 'ft',
        scale: 1,
        offset: 0
      },
      {
        id: 'IN',
        label: 'in',
        scale: 1 / 12,
        offset: 0
      },
      {
        id: 'M',
        label: 'm',
        scale: 3.28084,
        offset: 0
      },
      {
        id: 'CM',
        label: 'cm',
        scale: 3.28084 / 100,
        offset: 0
      }
    ]
  },
  {
    id: 'PRESSURE_KPA',
    label: 'Pressure',
    units: 'kPa',
    message: 'Pressure values must be already corrected for changes in atmospheric pressure',
    unitOptions: [
      {
        id: 'KPA',
        label: 'kPa',
        scale: 1,
        offset: 0
      },
      {
        id: 'PSI',
        label: 'psi',
        scale: 6.89476,
        offset: 0
      },
      {
        id: 'ATM',
        label: 'atm',
        scale: 101.32503982073,
        offset: 0
      },
      {
        id: 'BAR',
        label: 'bar',
        scale: 100.00003930000494279,
        offset: 0
      },
      {
        id: 'MBAR',
        label: 'mbar',
        scale: 0.1,
        offset: 0
      }
    ]
  },
  {
    id: 'SPCOND_USCM25',
    label: 'Specific Conductivity',
    units: 'uS/cm @ 25 degC',
    message: 'Conductivity must be temperature-corrected to 25 degC',
    unitOptions: [
      {
        id: 'USCM25',
        label: 'uS/cm @ 25 degC',
        scale: 1,
        offset: 0
      }
    ]
  },
  {
    id: 'WTEMP_C',
    label: 'Water Temperature',
    units: 'degC',
    unitOptions: [
      {
        id: 'C',
        label: 'degC',
        scale: 1,
        offset: 0
      },
      {
        id: 'F',
        label: 'degF',
        scale: 5 / 9,
        offset: -32
      }
    ]
  },
  {
    id: 'ATEMP_C',
    label: 'Air Temperature',
    units: 'degC',
    unitOptions: [
      {
        id: 'C',
        label: 'degC',
        scale: 1,
        offset: 0
      },
      {
        id: 'F',
        label: 'degF',
        scale: 5 / 9,
        offset: -32
      }
    ]
  },
  {
    id: 'OTHER',
    label: 'Other Variable',
    units: 'unknown',
    unitOptions: [
      {
        id: 'UNKNOWN',
        label: 'unknown',
        scale: 1,
        offset: 0
      }
    ]
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
