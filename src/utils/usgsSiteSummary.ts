import { decodeUSGSValue } from '@/constants/usgsSiteDictionary'
import type { USGSSiteInfo } from '@/hooks/useUSGSSiteInfo'
import type { InfoItem, InfoSection, RawAttributeRow } from './osePodSummary'

export type { InfoItem, InfoSection, RawAttributeRow }

// Columns whose meaning is documented in the RDB header but whose values are
// laid out for machines; these get consolidated rather than shown as-is.
const CONSOLIDATED_COLUMNS = new Set([
  'lat_va',
  'long_va',
  'dec_lat_va',
  'dec_long_va',
  'alt_va',
  'alt_datum_cd',
  'alt_acy_va',
  'well_depth_va',
  'hole_depth_va',
])

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
 * Decodes a coded column to its documented meaning, e.g. site_tp_cd "GW" ->
 * "Well (GW)". Uncoded columns and unknown codes fall through unchanged.
 */
export const decodeUSGSColumn = (
  record: Record<string, string>,
  column: string
): string | null => {
  const raw = text(record, column)
  if (raw == null) return null

  const decoded = decodeUSGSValue(column, raw, {
    stateFips: text(record, 'state_cd') ?? undefined,
  })

  return decoded ? `${decoded.label} (${raw})` : raw
}

const describeUSGS = (
  record: Record<string, string>,
  column: string
): string | undefined => {
  const raw = text(record, column)
  if (raw == null) return undefined

  const decoded = decodeUSGSValue(column, raw, {
    stateFips: text(record, 'state_cd') ?? undefined,
  })

  return decoded?.description
}

/** Converts a packed DDMMSS.ss / DDDMMSS.ss value into a DMS string. */
export const formatPackedDms = (
  packed: string,
  hemisphere: string
): string | null => {
  const match = packed.match(/^(\d+?)(\d{2})(\d{2}(?:\.\d+)?)$/)
  if (!match) return null

  const [, degrees, minutes, seconds] = match
  return `${Number(degrees)}° ${minutes}' ${seconds}" ${hemisphere}`
}

const formatCoordinates = (record: Record<string, string>): string | null => {
  const latitude = text(record, 'lat_va')
  const longitude = text(record, 'long_va')
  const decimalLatitude = text(record, 'dec_lat_va')
  const decimalLongitude = text(record, 'dec_long_va')

  const dms = [
    latitude && formatPackedDms(latitude, 'N'),
    longitude && formatPackedDms(longitude, 'W'),
  ].filter(Boolean)

  const decimal =
    decimalLatitude && decimalLongitude
      ? `(${decimalLatitude}, ${decimalLongitude})`
      : null

  const parts = [dms.join(', ') || null, decimal].filter(Boolean)
  return parts.length ? parts.join(' ') : null
}

const formatAltitude = (record: Record<string, string>): string | null => {
  const altitude = text(record, 'alt_va')
  if (!altitude) return null

  const datum = decodeUSGSColumn(record, 'alt_datum_cd')
  const accuracy = text(record, 'alt_acy_va')

  return [
    `${altitude} ft`,
    datum && `(${datum})`,
    accuracy && `±${accuracy} ft`,
  ]
    .filter(Boolean)
    .join(' ')
}

const formatDepths = (record: Record<string, string>): string | null => {
  const well = text(record, 'well_depth_va')
  const hole = text(record, 'hole_depth_va')

  return (
    [well && `${well} ft well`, hole && `${hole} ft hole`]
      .filter(Boolean)
      .join(', ') || null
  )
}

type SectionSpec = {
  title: string
  /** Columns rendered with their RDB label and decoded value. */
  columns: string[]
  /** Consolidated items placed ahead of the plain columns. */
  leading?: InfoItem[]
}

const SECTIONS: Array<Omit<SectionSpec, 'leading'>> = [
  {
    title: 'Site',
    columns: ['site_no', 'station_nm', 'site_tp_cd', 'agency_cd', 'project_no'],
  },
  {
    title: 'Location',
    columns: [
      'coord_meth_cd',
      'coord_acy_cd',
      'coord_datum_cd',
      'dec_coord_datum_cd',
      'alt_meth_cd',
      'district_cd',
      'state_cd',
      'county_cd',
      'country_cd',
      'land_net_ds',
      'map_nm',
      'map_scale_fc',
      'huc_cd',
      'basin_cd',
      'topo_cd',
    ],
  },
  {
    title: 'Well construction',
    columns: ['depth_src_cd', 'nat_aqfr_cd', 'aqfr_cd', 'aqfr_type_cd'],
  },
  {
    title: 'Record',
    columns: [
      'construction_dt',
      'inventory_dt',
      'reliability_cd',
      'gw_file_cd',
      'instruments_cd',
      'tz_cd',
      'local_time_fg',
      'drain_area_va',
      'contrib_drain_area_va',
    ],
  },
]

/**
 * Groups a USGS site record into the sections shown on the well details page.
 * Labels come from the RDB response header, coded values are expanded through
 * the USGS reference lists, and the packed coordinate, altitude, and depth
 * columns are consolidated into single lines.
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
        value: formatCoordinates(record) ?? '',
        description: labels['lat_va'],
      },
      {
        label: 'Altitude',
        value: formatAltitude(record) ?? '',
        description: labels['alt_va'],
      },
    ],
    'Well construction': [
      {
        label: 'Depth',
        value: formatDepths(record) ?? '',
        description: labels['well_depth_va'],
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
            description: describeUSGS(record, column),
          }
        })
        .filter((item): item is InfoItem => item !== null),
    ]

    return { title, items }
  }).filter((entry) => entry.items.length > 0)
}

/** Every column the site service returned, with its documented label. */
export const buildUSGSRawRows = (
  info: USGSSiteInfo | null | undefined
): RawAttributeRow[] => {
  if (!info) return []

  return Object.keys(info.record)
    .map((column, index) => ({
      id: index,
      field: column,
      label: info.labels[column] ?? column,
      value: decodeUSGSColumn(info.record, column) ?? '',
      description: describeUSGS(info.record, column) ?? '',
    }))
    .filter((row) => row.value !== '')
}
