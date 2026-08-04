import { describe, expect, it } from 'vitest'
import type { USGSSiteInfo } from '@/hooks/useUSGSSiteInfo'
import {
  buildUSGSRawRows,
  buildUSGSSections,
  decodeUSGSColumn,
  formatPackedDms,
} from '@/utils/usgsSiteSummary'

// Labels are exactly what the NWIS site service documents in its RDB header.
const labels = {
  agency_cd: 'Agency',
  site_no: 'Site identification number',
  station_nm: 'Site name',
  site_tp_cd: 'Site type',
  lat_va: 'DMS latitude',
  long_va: 'DMS longitude',
  dec_lat_va: 'Decimal latitude',
  dec_long_va: 'Decimal longitude',
  coord_acy_cd: 'Latitude-longitude accuracy',
  state_cd: 'State code',
  county_cd: 'County code',
  alt_va: 'Altitude of Gage/land surface',
  alt_datum_cd: 'Altitude datum',
  alt_acy_va: 'Altitude accuracy',
  well_depth_va: 'Well depth',
  hole_depth_va: 'Hole depth',
  aqfr_type_cd: 'Local aquifer type code',
  topo_cd: 'Topographic setting code',
}

const info: USGSSiteInfo = {
  labels,
  url: 'https://waterservices.usgs.gov/nwis/site/',
  record: {
    agency_cd: 'USGS',
    site_no: '323149106570101',
    station_nm: 'JL-49 NEAR LAS CRUCES, NM',
    site_tp_cd: 'GW',
    lat_va: '355228.2',
    long_va: '1060832.8',
    dec_lat_va: '35.8745',
    dec_long_va: '-106.1424444',
    coord_acy_cd: 'S',
    state_cd: '35',
    county_cd: '013',
    alt_va: '5491.66',
    alt_datum_cd: 'NAVD88',
    alt_acy_va: '.13',
    well_depth_va: '250',
    hole_depth_va: '260',
    aqfr_type_cd: 'U',
    topo_cd: 'V',
    project_no: '',
  },
}

const findItem = (label: string) =>
  buildUSGSSections(info)
    .flatMap((section) => section.items)
    .find((item) => item.label === label)

describe('formatPackedDms', () => {
  it('unpacks a DDMMSS.s latitude', () => {
    expect(formatPackedDms('355228.2', 'N')).toBe('35° 52\' 28.2" N')
  })

  it('unpacks a DDDMMSS.s longitude', () => {
    expect(formatPackedDms('1060832.8', 'W')).toBe('106° 08\' 32.8" W')
  })

  it('returns null for a value it cannot unpack', () => {
    expect(formatPackedDms('not-a-coordinate', 'N')).toBeNull()
  })
})

describe('decodeUSGSColumn', () => {
  it('expands a site type code to its documented name', () => {
    expect(decodeUSGSColumn(info.record, 'site_tp_cd')).toBe('Well (GW)')
  })

  it('resolves a county code against the record state FIPS code', () => {
    expect(decodeUSGSColumn(info.record, 'county_cd')).toBe(
      'Dona Ana County (013)'
    )
  })

  it('leaves uncoded columns untouched', () => {
    expect(decodeUSGSColumn(info.record, 'station_nm')).toBe(
      'JL-49 NEAR LAS CRUCES, NM'
    )
  })

  it('returns null for an empty column', () => {
    expect(decodeUSGSColumn(info.record, 'project_no')).toBeNull()
  })
})

describe('buildUSGSSections', () => {
  it('labels columns with the definitions from the RDB header', () => {
    expect(findItem('Site name')?.value).toBe('JL-49 NEAR LAS CRUCES, NM')
    expect(findItem('Site type')?.value).toBe('Well (GW)')
  })

  it('consolidates the packed and decimal coordinates into one line', () => {
    expect(findItem('Latitude / longitude')?.value).toBe(
      '35° 52\' 28.2" N, 106° 08\' 32.8" W (35.8745, -106.1424444)'
    )
  })

  it('consolidates altitude with its datum and accuracy', () => {
    expect(findItem('Altitude')?.value).toBe(
      '5491.66 ft (North American Vertical Datum of 1988 (NAVD88)) ±.13 ft'
    )
  })

  it('consolidates well and hole depth', () => {
    expect(findItem('Depth')?.value).toBe('250 ft well, 260 ft hole')
  })

  it('drops the columns the site returned empty', () => {
    const labelsShown = buildUSGSSections(info).flatMap((section) =>
      section.items.map((item) => item.label)
    )

    expect(labelsShown).not.toContain('Project number')
  })

  it('returns no sections without a record', () => {
    expect(buildUSGSSections(null)).toEqual([])
  })
})

describe('buildUSGSRawRows', () => {
  it('carries the header label and the decoded value for each column', () => {
    const rows = buildUSGSRawRows(info)

    expect(rows.find((row) => row.field === 'site_tp_cd')).toMatchObject({
      label: 'Site type',
      value: 'Well (GW)',
    })
  })

  it('omits columns the site returned empty', () => {
    expect(buildUSGSRawRows(info).map((row) => row.field)).not.toContain(
      'project_no'
    )
  })
})
