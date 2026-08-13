import { describe, expect, it } from 'vitest'
import type { USGSSiteInfo } from '@/hooks/useUSGSSiteInfo'
import {
  buildUSGSRawRows,
  buildUSGSSections,
  decodeUSGSColumn,
  formatDecimalDms,
} from '@/utils/usgsSiteSummary'

// Labels and descriptions are exactly what the monitoring-locations collection
// publishes for itself via its queryables endpoint.
const labels = {
  id: 'Monitoring location ID',
  agency_code: 'Agency code',
  monitoring_location_number: 'Monitoring location number',
  monitoring_location_name: 'Monitoring location name',
  site_type_code: 'Monitoring location type code',
  state_code: 'State code',
  county_code: 'County code',
  altitude: 'Altitude',
  altitude_accuracy: 'Altitude accuracy',
  vertical_datum: 'Vertical datum',
  well_constructed_depth: 'Well constructed depth',
  hole_constructed_depth: 'Hole constructed depth',
  aquifer_type_code: 'Aquifer type code',
  hydrologic_unit_code: 'Hydrologic unit code (HUC)',
}

const descriptions = {
  geometry: 'The location of the monitoring location.',
  site_type_code: 'A code describing the type of monitoring location.',
}

const info: USGSSiteInfo = {
  labels,
  descriptions,
  latitude: 35.8745,
  longitude: -106.1424444,
  url: 'https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items',
  record: {
    id: 'USGS-323149106570101',
    agency_code: 'USGS',
    agency_name: 'U.S. Geological Survey',
    monitoring_location_number: '323149106570101',
    monitoring_location_name: 'JL-49 NEAR LAS CRUCES, NM',
    site_type_code: 'GW',
    site_type: 'Well',
    state_code: '35',
    state_name: 'New Mexico',
    county_code: '013',
    county_name: 'Dona Ana County',
    altitude: '5491.66',
    vertical_datum: 'NAVD88',
    altitude_accuracy: '.13',
    well_constructed_depth: '250',
    hole_constructed_depth: '260',
    aquifer_type_code: 'U',
    hydrologic_unit_code: '13030102',
  },
}

const findItem = (label: string) =>
  buildUSGSSections(info)
    .flatMap((section) => section.items)
    .find((item) => item.label === label)

describe('formatDecimalDms', () => {
  it('converts a positive decimal latitude', () => {
    expect(formatDecimalDms(35.8745, 'N', 'S')).toBe('35° 52\' 28.20" N')
  })

  it('uses the negative hemisphere for a western longitude', () => {
    expect(formatDecimalDms(-106.1424444, 'E', 'W')).toBe('106° 08\' 32.80" W')
  })

  it('returns null for a value it cannot convert', () => {
    expect(formatDecimalDms(Number.NaN, 'N', 'S')).toBeNull()
  })
})

describe('decodeUSGSColumn', () => {
  it('prefers the name the API resolves alongside the code', () => {
    expect(decodeUSGSColumn(info.record, 'site_type_code')).toBe('Well (GW)')
    expect(decodeUSGSColumn(info.record, 'county_code')).toBe(
      'Dona Ana County (013)'
    )
  })

  it('falls back to the reference tables when the API sends no name', () => {
    expect(decodeUSGSColumn(info.record, 'aquifer_type_code')).toBe(
      'Unconfined single aquifer (U)'
    )
  })

  it('leaves uncoded columns untouched', () => {
    expect(decodeUSGSColumn(info.record, 'monitoring_location_name')).toBe(
      'JL-49 NEAR LAS CRUCES, NM'
    )
  })

  it('returns null for a column the collection did not return', () => {
    expect(decodeUSGSColumn(info.record, 'basin_code')).toBeNull()
  })
})

describe('buildUSGSSections', () => {
  it('labels columns with the collection field definitions', () => {
    expect(findItem('Monitoring location name')?.value).toBe(
      'JL-49 NEAR LAS CRUCES, NM'
    )
    expect(findItem('Monitoring location type code')?.value).toBe('Well (GW)')
  })

  it('derives the coordinate line from the feature geometry', () => {
    expect(findItem('Latitude / longitude')?.value).toBe(
      '35° 52\' 28.20" N, 106° 08\' 32.80" W (35.8745, -106.1424444)'
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

  it('drops the columns the collection did not return', () => {
    const labelsShown = buildUSGSSections(info).flatMap((section) =>
      section.items.map((item) => item.label)
    )

    expect(labelsShown).not.toContain('Basin code')
  })

  it('returns no sections without a record', () => {
    expect(buildUSGSSections(null)).toEqual([])
  })
})

describe('buildUSGSRawRows', () => {
  it('carries the field label and the decoded value for each property', () => {
    const rows = buildUSGSRawRows(info)

    expect(rows.find((row) => row.field === 'site_type_code')).toMatchObject({
      label: 'Monitoring location type code',
      value: 'Well (GW)',
    })
  })

  it('omits the sibling name properties folded into their codes', () => {
    const fields = buildUSGSRawRows(info).map((row) => row.field)

    expect(fields).not.toContain('site_type')
    expect(fields).not.toContain('county_name')
    expect(fields).toContain('site_type_code')
  })
})
