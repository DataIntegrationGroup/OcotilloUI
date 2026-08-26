import { decodeUSGSValue } from '@/constants/usgsSiteDictionary'
import type { USGSSiteInfo } from '@/hooks/useUSGSSiteInfo'
import type { InfoItem, InfoSection, RawAttributeRow } from './osePodSummary'

export type { InfoItem, InfoSection, RawAttributeRow }

// Properties folded into a consolidated line; they are not shown on their own.
const CONSOLIDATED_COLUMNS = new Set([
  'altitude',
  'altitude_accuracy',
  'vertical_datum',
  'vertical_datum_name',
  'well_constructed_depth',
  'hole_constructed_depth',
])

/**
 * Coded properties the OGC API resolves for us, code -> the sibling property
 * carrying the human-readable name. These are preferred over the local
 * reference tables, and the sibling is not rendered as a row of its own.
 */
const NAME_SIBLINGS: Record<string, string> = {
  agency_code: 'agency_name',
  site_type_code: 'site_type',
  state_code: 'state_name',
  county_code: 'county_name',
  country_code: 'country_name',
  vertical_datum: 'vertical_datum_name',
  altitude_method_code: 'altitude_method_name',
  horizontal_position_method_code: 'horizontal_position_method_name',
  horizontal_positional_accuracy_code: 'horizontal_positional_accuracy',
  original_horizontal_datum: 'original_horizontal_datum_name',
}

const SIBLING_NAME_COLUMNS = new Set(Object.values(NAME_SIBLINGS))

const text = (
  record: Record<string, string>,
  column: string
): string | null => {
  const value = record[column]
  if (value == null) return null

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Decodes a coded column to its documented meaning, e.g. site_type_code "GW" ->
 * "Well (GW)". The API's own name property wins where it exists; otherwise the
 * local USGS reference tables are consulted. Uncoded columns pass through.
 */
export const decodeUSGSColumn = (
  record: Record<string, string>,
  column: string
): string | null => {
  const raw = text(record, column)
  if (raw == null) return null

  const sibling = NAME_SIBLINGS[column]
  const name = sibling ? text(record, sibling) : null
  if (name) return `${name} (${raw})`

  const decoded = decodeUSGSValue(column, raw, {
    stateFips: text(record, 'state_code') ?? undefined,
  })

  return decoded ? `${decoded.label} (${raw})` : raw
}

const describeUSGS = (
  info: USGSSiteInfo,
  column: string
): string | undefined => {
  const raw = text(info.record, column)

  // A code's own meaning is more useful than the field's definition, so the
  // reference table wins and the API description is the fallback.
  if (raw != null) {
    const decoded = decodeUSGSValue(column, raw, {
      stateFips: text(info.record, 'state_code') ?? undefined,
    })

    if (decoded?.description) return decoded.description
  }

  return info.descriptions[column]
}

/** Converts a decimal degree value into a DMS string. */
export const formatDecimalDms = (
  value: number,
  positive: string,
  negative: string
): string | null => {
  if (!Number.isFinite(value)) return null

  const hemisphere = value < 0 ? negative : positive
  const absolute = Math.abs(value)
  const degrees = Math.floor(absolute)
  const minutesFull = (absolute - degrees) * 60
  const minutes = Math.floor(minutesFull)
  const seconds = (minutesFull - minutes) * 60

  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = seconds.toFixed(2).padStart(5, '0')

  return `${degrees}° ${paddedMinutes}' ${paddedSeconds}" ${hemisphere}`
}

const formatCoordinates = (info: USGSSiteInfo): string | null => {
  const { latitude, longitude } = info
  if (latitude == null || longitude == null) return null

  const dms = [
    formatDecimalDms(latitude, 'N', 'S'),
    formatDecimalDms(longitude, 'E', 'W'),
  ].filter(Boolean)

  const decimal = `(${latitude}, ${longitude})`
  const parts = [dms.join(', ') || null, decimal].filter(Boolean)

  return parts.length ? parts.join(' ') : null
}

const formatAltitude = (record: Record<string, string>): string | null => {
  const altitude = text(record, 'altitude')
  if (!altitude) return null

  const datum = decodeUSGSColumn(record, 'vertical_datum')
  const accuracy = text(record, 'altitude_accuracy')

  return [
    `${altitude} ft`,
    datum && `(${datum})`,
    accuracy && `±${accuracy} ft`,
  ]
    .filter(Boolean)
    .join(' ')
}

const formatDepths = (record: Record<string, string>): string | null => {
  const well = text(record, 'well_constructed_depth')
  const hole = text(record, 'hole_constructed_depth')

  return (
    [well && `${well} ft well`, hole && `${hole} ft hole`]
      .filter(Boolean)
      .join(', ') || null
  )
}

type SectionSpec = {
  title: string
  /** Columns rendered with their API label and decoded value. */
  columns: string[]
  /** Consolidated items placed ahead of the plain columns. */
  leading?: InfoItem[]
}

const SECTIONS: Array<Omit<SectionSpec, 'leading'>> = [
  {
    title: 'Site',
    columns: [
      'monitoring_location_number',
      'monitoring_location_name',
      'site_type_code',
      'agency_code',
      'id',
    ],
  },
  {
    title: 'Location',
    columns: [
      'horizontal_position_method_code',
      'horizontal_positional_accuracy_code',
      'original_horizontal_datum',
      'altitude_method_code',
      'district_code',
      'state_code',
      'county_code',
      'country_code',
      'minor_civil_division_code',
      'hydrologic_unit_code',
      'basin_code',
    ],
  },
  {
    title: 'Well construction',
    columns: [
      'depth_source_code',
      'national_aquifer_code',
      'aquifer_code',
      'aquifer_type_code',
    ],
  },
  {
    title: 'Record',
    columns: [
      'construction_date',
      'time_zone_abbreviation',
      'uses_daylight_savings',
      'drainage_area',
      'contributing_drainage_area',
      'revision_note',
      'revision_created',
      'revision_modified',
    ],
  },
]

/**
 * Groups a USGS monitoring location into the sections shown on the well details
 * page. Labels come from the collection's published field definitions, coded
 * values are expanded through the API's name properties or the USGS reference
 * lists, and the coordinate, altitude, and depth properties are consolidated
 * into single lines.
 */
export const buildUSGSSections = (
  info: USGSSiteInfo | null | undefined
): InfoSection[] => {
  if (!info) return []

  const { record, labels } = info

  const leading: Record<string, InfoItem[]> = {
    Location: [
      {
        label: 'Latitude / longitude',
        value: formatCoordinates(info) ?? '',
        description: info.descriptions['geometry'],
      },
      {
        label: 'Altitude',
        value: formatAltitude(record) ?? '',
        description: labels['altitude'],
      },
    ],
    'Well construction': [
      {
        label: 'Depth',
        value: formatDepths(record) ?? '',
        description: labels['well_constructed_depth'],
      },
    ],
  }

  return SECTIONS.map(({ title, columns }) => {
    const items: InfoItem[] = [
      ...(leading[title] ?? []).filter((item) => item.value),
      ...columns
        .filter((column) => !CONSOLIDATED_COLUMNS.has(column))
        .map((column): InfoItem | null => {
          const value = decodeUSGSColumn(record, column)
          if (value == null) return null

          return {
            label: labels[column] ?? column,
            value,
            description: describeUSGS(info, column),
          }
        })
        .filter((item): item is InfoItem => item !== null),
    ]

    return { title, items }
  }).filter((entry) => entry.items.length > 0)
}

/** Every property the collection returned, with its documented label. */
export const buildUSGSRawRows = (
  info: USGSSiteInfo | null | undefined
): RawAttributeRow[] => {
  if (!info) return []

  return Object.keys(info.record)
    .filter((column) => !SIBLING_NAME_COLUMNS.has(column))
    .map((column, index) => ({
      id: index,
      field: column,
      label: info.labels[column] ?? column,
      value: decodeUSGSColumn(info.record, column) ?? '',
      description: describeUSGS(info, column) ?? '',
    }))
    .filter((row) => row.value !== '')
}
