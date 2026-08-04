import {
  OSE_POD_CODE_TABLES,
  OSE_POD_FIELDS,
} from '@/constants/osePodDictionary'
import { formatAppDate } from './Date'

export type OSEPODAttributes = Record<string, unknown>

export type InfoItem = {
  label: string
  value: string
  /** Dictionary definition, shown as help text on the label. */
  description?: string
  href?: string
}

export type InfoSection = {
  title: string
  items: InfoItem[]
}

export type RawAttributeRow = {
  id: number
  field: string
  label: string
  value: string
  description: string
}

// The service pads empty text fields with a single space rather than returning
// null, and uses 0 as the "not recorded" sentinel for measured quantities.
const text = (attributes: OSEPODAttributes, field: string): string | null => {
  const value = attributes[field]
  if (value == null) return null

  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

const num = (
  attributes: OSEPODAttributes,
  field: string,
  { zeroIsMissing = true }: { zeroIsMissing?: boolean } = {}
): number | null => {
  const value = attributes[field]
  if (value == null || value === '') return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  if (zeroIsMissing && parsed === 0) return null

  return parsed
}

const decode = (field: string, value: string): string => {
  const codeTable = OSE_POD_FIELDS[field]?.codeTable
  if (!codeTable) return value

  return OSE_POD_CODE_TABLES[codeTable]?.values[value] ?? value
}

const describe = (field: string): string | undefined =>
  OSE_POD_FIELDS[field]?.description || undefined

const labelFor = (field: string): string =>
  OSE_POD_FIELDS[field]?.label ?? field

const formatCount = (value: number, precision = 0): string =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(value)

// ArcGIS returns dates as epoch milliseconds set to midnight in the OSE's own
// timezone, which is the app timezone, so formatting there recovers the
// calendar date the OSE recorded.
const formatEpochDate = (value: number): string =>
  formatAppDate(new Date(value).toISOString())

/**
 * Builds the PLSS legal location, written finest subdivision first, e.g.
 * "SE¼ SW¼ Sec. 22, T11N R10W".
 */
export const formatPlssLocation = (
  attributes: OSEPODAttributes
): string | null => {
  const quarters = ['qtr_64th', 'qtr_16th', 'qtr_4th']
    .map((field) => {
      const code = text(attributes, field)
      if (!code) return null

      // The code table spells these "NW quarter"; the first word is the call.
      const decoded = decode(field, code)
      const call = decoded.split(' ')[0]
      return call === code ? null : `${call}¼`
    })
    .filter((call): call is string => Boolean(call))

  const section = text(attributes, 'sec')
  const township = text(attributes, 'tws')
  const range = text(attributes, 'rng')

  const parts: string[] = []
  if (quarters.length) parts.push(quarters.join(' '))
  if (section) parts.push(`Sec. ${section}`)

  const townshipRange = [township && `T${township}`, range && `R${range}`]
    .filter(Boolean)
    .join(' ')

  const location = parts.join(' ')
  if (!location && !townshipRange) return null

  return [location, townshipRange].filter(Boolean).join(', ')
}

/** Formats the six lat/lon component fields as one DMS pair with decimal degrees. */
export const formatDmsCoordinates = (
  attributes: OSEPODAttributes
): string | null => {
  const parts = [
    'lat_deg',
    'lat_min',
    'lat_sec',
    'lon_deg',
    'lon_min',
    'lon_sec',
  ].map((field) => num(attributes, field, { zeroIsMissing: false }) ?? 0)

  const [latDeg, latMin, latSec, lonDeg, lonMin, lonSec] = parts
  // Every POD is in New Mexico, so a zeroed degrees field means "not recorded"
  // rather than a real position on the equator or prime meridian.
  if (latDeg === 0 || lonDeg === 0) return null

  const toDecimal = (deg: number, min: number, sec: number) =>
    deg + min / 60 + sec / 3600

  const latitude = toDecimal(latDeg, latMin, latSec)
  // Longitudes are recorded as unsigned degrees west.
  const longitude = -toDecimal(Math.abs(lonDeg), lonMin, lonSec)

  const dms = (deg: number, min: number, sec: number, hemisphere: string) =>
    `${Math.abs(deg)}° ${min}' ${formatCount(sec, 1)}" ${hemisphere}`

  return (
    `${dms(latDeg, latMin, latSec, 'N')}, ` +
    `${dms(lonDeg, lonMin, lonSec, 'W')} ` +
    `(${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
  )
}

/** Formats the UTM zone, easting, northing, and datum as one line. */
export const formatUtmCoordinates = (
  attributes: OSEPODAttributes
): string | null => {
  const easting = num(attributes, 'easting')
  const northing = num(attributes, 'northing')
  if (easting == null || northing == null) return null

  const zone = text(attributes, 'utm_zone')
  const datum = text(attributes, 'datum')

  const coordinates = `${formatCount(easting)} mE, ${formatCount(northing)} mN`
  return [
    zone && `Zone ${zone}`,
    coordinates,
    datum && `(${decode('datum', datum)})`,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Formats the State Plane zone with its x/y coordinate pair. */
export const formatStatePlaneCoordinates = (
  attributes: OSEPODAttributes
): string | null => {
  const x = num(attributes, 'x')
  const y = num(attributes, 'y')
  const zone = text(attributes, 'zone_')

  if (x == null || y == null) return zone ? decode('zone_', zone) : null

  const coordinates = `${formatCount(x)}, ${formatCount(y)}`
  return zone ? `${decode('zone_', zone)} — ${coordinates}` : coordinates
}

const joinName = (
  attributes: OSEPODAttributes,
  firstField: string,
  lastField: string
): string | null => {
  const first = text(attributes, firstField)
  const last = text(attributes, lastField)
  const name = [first, last].filter(Boolean).join(' ')

  return name || null
}

const formatOwnerAddress = (attributes: OSEPODAttributes): string | null => {
  const street = [text(attributes, 'addr1'), text(attributes, 'addr2')]
    .filter(Boolean)
    .join(', ')

  const city = text(attributes, 'city')
  const state = text(attributes, 'state')
  const zip = text(attributes, 'zip')
  const cityLine = [city, [state, zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

  return [street, cityLine].filter(Boolean).join(', ') || null
}

type ItemSpec = {
  label: string
  value: string | null
  description?: string
  href?: string
}

const section = (title: string, specs: ItemSpec[]): InfoSection => ({
  title,
  items: specs
    .filter((spec): spec is ItemSpec & { value: string } => Boolean(spec.value))
    .map(({ label, value, description, href }) => ({
      label,
      value,
      description,
      href,
    })),
})

/** A plain field, using the dictionary's label and description. */
const field = (
  attributes: OSEPODAttributes,
  name: string,
  overrides: { label?: string; suffix?: string } = {}
): ItemSpec => {
  const raw = text(attributes, name)
  const definition = OSE_POD_FIELDS[name]
  const isNumeric =
    definition?.dataType === 'Double' ||
    definition?.dataType === 'Long Integer' ||
    definition?.dataType === 'Short Integer'

  let value: string | null = null
  if (raw != null) {
    if (isNumeric) {
      const parsed = num(attributes, name)
      value = parsed == null ? null : formatCount(parsed, 2)
    } else {
      value = decode(name, raw)
    }
  }

  return {
    label: overrides.label ?? labelFor(name),
    value: value && overrides.suffix ? `${value} ${overrides.suffix}` : value,
    description: describe(name),
  }
}

const dateField = (attributes: OSEPODAttributes, name: string): ItemSpec => {
  const epoch = num(attributes, name, { zeroIsMissing: false })

  return {
    label: labelFor(name),
    value: epoch == null ? null : formatEpochDate(epoch),
    description: describe(name),
  }
}

/**
 * Groups a POD's attributes into the sections shown on the well details page.
 * Empty fields — blank strings and the service's 0 sentinels — are dropped, and
 * the location fields the OSE splits across many columns (PLSS calls, DMS
 * components, UTM, State Plane) are consolidated into single lines.
 */
export const buildOSEPODSections = (
  attributes: OSEPODAttributes | null | undefined
): InfoSection[] => {
  if (!attributes) return []

  const nmwrrsUrl = text(attributes, 'nmwrrs_wrs')

  const sections = [
    section('Water right', [
      field(attributes, 'db_file'),
      field(attributes, 'basin'),
      field(attributes, 'sub_basin'),
      field(attributes, 'status'),
      field(attributes, 'use_'),
      field(attributes, 'total_div', { suffix: 'acre-ft' }),
      field(attributes, 'restrict_', { suffix: 'acre-ft' }),
      field(attributes, 'wr_count'),
      field(attributes, 'sub_file'),
      {
        label: 'NMWRRS water right summary',
        value: nmwrrsUrl?.startsWith('https://') ? 'Open report' : null,
        description: describe('nmwrrs_wrs'),
        href: nmwrrsUrl ?? undefined,
      },
    ]),
    section('Point of diversion', [
      field(attributes, 'pod_file'),
      field(attributes, 'pod_name'),
      field(attributes, 'pod_status'),
      field(attributes, 'pod_sub_ba'),
      field(attributes, 'well_tag'),
      field(attributes, 'ditch_name'),
      field(attributes, 'use_of_wel'),
      field(attributes, 'replaced'),
    ]),
    section('Location', [
      {
        label: 'PLSS location',
        value: formatPlssLocation(attributes),
        description:
          'Township, range, section, and quarter calls, finest subdivision first.',
      },
      field(attributes, 'county'),
      {
        label: 'Latitude / longitude',
        value: formatDmsCoordinates(attributes),
        description: describe('lat_deg'),
      },
      {
        label: 'UTM',
        value: formatUtmCoordinates(attributes),
        description: describe('easting'),
      },
      {
        label: 'State Plane',
        value: formatStatePlaneCoordinates(attributes),
        description: describe('zone_'),
      },
      field(attributes, 'elevation', { suffix: 'ft' }),
      field(attributes, 'landgrant'),
      field(attributes, 'subdiv_nam'),
      field(attributes, 'subdiv_loc'),
      field(attributes, 'legal'),
      field(attributes, 'other_loc'),
      field(attributes, 'lat_lon_so'),
      field(attributes, 'lat_lon_ac'),
      field(attributes, 'utm_source'),
      field(attributes, 'utm_accura'),
      field(attributes, 'loc_error'),
    ]),
    section('Well construction', [
      field(attributes, 'depth_well', { suffix: 'ft' }),
      field(attributes, 'depth_wate', { suffix: 'ft' }),
      field(attributes, 'static_lev', { suffix: 'ft' }),
      field(attributes, 'casing_siz', { suffix: 'in' }),
      field(attributes, 'estimate_y', { suffix: 'gpm' }),
      field(attributes, 'grnd_wtr_s'),
      field(attributes, 'aquifer'),
      field(attributes, 'percent_sh', { suffix: '%' }),
      field(attributes, 'pump_type'),
      field(attributes, 'pump_seria'),
      field(attributes, 'discharge'),
      dateField(attributes, 'start_date'),
      dateField(attributes, 'finish_dat'),
      dateField(attributes, 'plug_date'),
      dateField(attributes, 'pcw_rcv_da'),
      dateField(attributes, 'log_file_d'),
      dateField(attributes, 'sched_date'),
    ]),
    section('Owner and contact', [
      { label: 'Owner', value: joinName(attributes, 'own_fname', 'own_lname') },
      { label: 'Address', value: formatOwnerAddress(attributes) },
      {
        label: 'Contact',
        value: joinName(attributes, 'contact_fn', 'contact_ln'),
      },
    ]),
  ]

  return sections.filter((entry) => entry.items.length > 0)
}

/** Every attribute the service returned, with its dictionary label and definition. */
export const buildOSEPODRawRows = (
  attributes: OSEPODAttributes | null | undefined
): RawAttributeRow[] => {
  if (!attributes) return []

  return Object.keys(attributes)
    .map((name, index) => {
      const raw = text(attributes, name)

      return {
        id: index,
        field: name,
        label: labelFor(name),
        value: raw == null ? '' : decode(name, raw),
        description: describe(name) ?? '',
      }
    })
    .filter((row) => row.value !== '')
}
