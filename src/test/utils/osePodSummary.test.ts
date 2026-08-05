import { describe, expect, it } from 'vitest'
import {
  buildOSEPODRawRows,
  buildOSEPODSections,
  formatDmsCoordinates,
  formatPlssLocation,
  formatStatePlaneCoordinates,
  formatUtmCoordinates,
} from '@/utils/osePodSummary'

// Trimmed from a live OSE_Points_of_Diversion response. The service pads empty
// text fields with a single space and uses 0 for unrecorded measurements, so
// both sentinels are kept here on purpose.
const pod = {
  OBJECTID: 1,
  pod_basin: 'B',
  pod_nbr: '00928',
  pod_suffix: ' ',
  pod_name: ' ',
  tws: '11N',
  rng: '10W',
  sec: '22',
  qtr_4th: '3',
  qtr_16th: '4',
  qtr_64th: ' ',
  zone_: ' ',
  x: 0,
  y: 0,
  county: 'CI',
  elevation: 0,
  depth_well: 138,
  grnd_wtr_s: 'S',
  depth_wate: 100,
  use_of_wel: 'Domestic',
  lat_deg: 0,
  lat_min: 0,
  lat_sec: 0,
  lon_deg: 0,
  lon_min: 0,
  lon_sec: 0,
  estimate_y: 30,
  pod_status: 'ACT',
  casing_siz: 0,
  utm_zone: '13',
  easting: 237475,
  northing: 3894893,
  datum: 'NAD83',
  static_lev: 0,
  pod_file: 'B-00928',
  basin: 'B',
  status: 'PMT',
  use_: 'DOM',
  total_div: 3,
  db_file: 'B-00928',
  own_lname: 'Gallegos',
  own_fname: 'Bennie G',
  addr1: '408 W Santa Fe',
  addr2: ' ',
  city: 'Grants',
  state: 'NM',
  zip: '87020',
  contact_ln: ' ',
  nmwrrs_wrs:
    'https://nmwrrs.ose.nm.gov/ReportDispatcher?type=WRHTML&name=WaterRightSummaryHTML.jrxml&basin=B&nbr=00928&suffix=',
  log_file_d: 373273200000,
}

const findItem = (label: string) =>
  buildOSEPODSections(pod)
    .flatMap((section) => section.items)
    .find((item) => item.label === label)

describe('formatPlssLocation', () => {
  it('writes the quarter calls finest subdivision first', () => {
    expect(formatPlssLocation(pod)).toBe('SE¼ SW¼ Sec. 22, T11N R10W')
  })

  it('omits the quarter calls when none are recorded', () => {
    expect(
      formatPlssLocation({ ...pod, qtr_4th: ' ', qtr_16th: ' ', qtr_64th: ' ' })
    ).toBe('Sec. 22, T11N R10W')
  })

  it('returns null when no PLSS fields are populated', () => {
    expect(formatPlssLocation({})).toBeNull()
  })
})

describe('formatDmsCoordinates', () => {
  it('treats the zeroed degree fields as unrecorded', () => {
    expect(formatDmsCoordinates(pod)).toBeNull()
  })

  it('combines the six component fields into DMS and decimal degrees', () => {
    const located = {
      ...pod,
      lat_deg: 35,
      lat_min: 52,
      lat_sec: 28.2,
      lon_deg: 106,
      lon_min: 8,
      lon_sec: 32.8,
    }

    expect(formatDmsCoordinates(located)).toBe(
      '35° 52\' 28.2" N, 106° 8\' 32.8" W (35.87450, -106.14244)'
    )
  })
})

describe('formatUtmCoordinates', () => {
  it('combines zone, easting, northing, and datum', () => {
    expect(formatUtmCoordinates(pod)).toBe(
      'Zone 13 237,475 mE, 3,894,893 mN (North American Datum of 1983)'
    )
  })

  it('returns null when the coordinate pair is missing', () => {
    expect(formatUtmCoordinates({ ...pod, easting: 0, northing: 0 })).toBeNull()
  })
})

describe('formatStatePlaneCoordinates', () => {
  it('returns null when neither the zone nor the coordinates are recorded', () => {
    expect(formatStatePlaneCoordinates(pod)).toBeNull()
  })

  it('decodes the zone and pairs it with the coordinates', () => {
    expect(
      formatStatePlaneCoordinates({ ...pod, zone_: 'C', x: 1234567, y: 890123 })
    ).toBe('Central (3002) — 1,234,567, 890,123')
  })
})

describe('buildOSEPODSections', () => {
  it('decodes coded values through the OSE code tables', () => {
    expect(findItem('Status')?.value).toBe('Permit')
    expect(findItem('Use')?.value).toBe('72-12-1 domestic one household')
    expect(findItem('County')?.value).toBe('Cibola')
    expect(findItem('POD Status')?.value).toBe('Active')
    expect(findItem('Groundwater Source Type')?.value).toBe('Shallow')
  })

  it('carries the dictionary definition as the item description', () => {
    expect(findItem('Well Depth')?.description).toBe(
      'Total depth of well to nearest foot'
    )
  })

  it('drops blank strings and the service zero sentinels', () => {
    const labels = buildOSEPODSections(pod).flatMap((section) =>
      section.items.map((item) => item.label)
    )

    expect(labels).not.toContain('POD Name') // padded with a single space
    expect(labels).not.toContain('Elevation') // recorded as 0
    expect(labels).not.toContain('Casing Size')
  })

  it('consolidates the owner name and address', () => {
    expect(findItem('Owner')?.value).toBe('Bennie G Gallegos')
    expect(findItem('Address')?.value).toBe('408 W Santa Fe, Grants, NM 87020')
  })

  it('exposes the NMWRRS report as a link', () => {
    const item = findItem('NMWRRS water right summary')

    expect(item?.value).toBe('Open report')
    expect(item?.href).toBe(pod.nmwrrs_wrs)
  })

  // The service records dates as midnight in the app timezone, so the calendar
  // date has to be read there rather than in UTC.
  it('formats epoch date fields as calendar dates', () => {
    expect(findItem('Well Record Filed Date')?.value).toBe('Oct 30, 1981')
  })

  it('returns no sections when there are no attributes', () => {
    expect(buildOSEPODSections(null)).toEqual([])
  })
})

describe('buildOSEPODRawRows', () => {
  it('labels and decodes every populated attribute', () => {
    const rows = buildOSEPODRawRows(pod)
    const status = rows.find((row) => row.field === 'status')

    expect(status).toMatchObject({
      field: 'status',
      label: 'Status',
      value: 'Permit',
      description: 'The current status of a water right',
    })
  })

  it('omits attributes the service padded with a blank', () => {
    expect(buildOSEPODRawRows(pod).map((row) => row.field)).not.toContain(
      'pod_name'
    )
  })
})
