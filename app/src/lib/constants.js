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

export const stationStatusTypes = [
  {
    value: 'ACTIVE',
    label: 'Active',
    description: 'Photos are actively being collected at this station.'
  },
  {
    value: 'DISCONTINUED',
    label: 'Discontinued',
    description: 'Photos are no longer being collected at this station.'
  }
]

// https://maps.waterdata.usgs.gov/mapper/help/sitetype.html#SW
export const waterbodyTypes = [
  {
    value: 'ST',
    label: 'Stream',
    description: 'A body of running water moving under gravity flow in a defined channel. The channel may be entirely natural, or altered by engineering practices through straightening, dredging, and (or) lining. An entirely artificial channel should be classified as Canal or Ditch.'
  },
  {
    value: 'LK',
    label: 'Lake, Reservoir, Impoundment',
    description: 'An inland body of standing fresh or saline water that is generally too deep to permit submerged aquatic vegetation to take root across the entire body (cf: wetland). Includes an expanded part of a river, a reservoir behind a dam, and a natural or excavated depression containing a water body without surface-water inlet and/or outlet.'
  },
  {
    value: 'WE',
    label: 'Wetland',
    description: 'Areas that are inundated or saturated by surface or groundwater at a frequency and duration sufficient to support, and that under normal circumstances do support, a prevalence of vegetation typically adapted for life in saturated soil conditions. Wetlands generally include swamps, marshes, bogs and similar areas. Wetlands may be forested or unforested, and naturally or artificially created.'
  },
  {
    value: 'ST-CA',
    label: 'Canal',
    description: 'An artificial watercourse designed for navigation, drainage, or irrigation by connecting two or more bodies of water; it is larger than a ditch.'
  },
  {
    value: 'ST-DCH',
    label: 'Ditch',
    description: 'An excavation artificially dug in the ground, either lined or unlined, for conveying water for drainage or irrigation; it is smaller than a canal.'
  },
  {
    value: 'ST-TS',
    label: 'Tidal stream',
    description: 'A stream reach where the flow is influenced by the tide, but where the water chemistry is not normally influenced. A site where ocean water typically mixes with stream water should be coded as an estuary.'
  },
  {
    value: 'ES',
    label: 'Estuary',
    description: 'A coastal inlet of the sea or ocean; esp. the mouth of a river, where tide water normally mixes with stream water (modified, Webster). Salinity in estuaries typically ranges from 1 to 25 Practical Salinity Units (psu), as compared oceanic values around 35-psu. See also: tidal stream and coastal.'
  },
  {
    value: 'OC-CO',
    label: 'Coastal',
    description: 'An oceanic site that is located off-shore beyond the tidal mixing zone (estuary) but close enough to the shore that the investigator considers the presence of the coast to be important. Coastal sites typically are within three nautical miles of the shore.'
  },
  {
    value: 'OC',
    label: 'Ocean',
    description: 'Site in the open ocean, gulf, or sea. (See also: Coastal, Estuary, and Tidal stream).'
  }
]
