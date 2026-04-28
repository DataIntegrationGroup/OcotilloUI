/**
 * Map visible-layer CSV for water wells: column titles match the Wells list where the same
 * field exists (`WellListColumnLabels`). Extra export-only headers use `WellMapCsvOnlyLabels`.
 */
import type { IWellDetails } from '@/interfaces/ocotillo'
import type { IWell } from '@/interfaces/ocotillo'
import type { IContact } from '@/interfaces/ocotillo'
import { formatAppDate } from '@/utils'
import { buildWellShowAbsoluteUrl } from '@/utils/wellPublicUrls'
import { WellListColumnLabels } from '@/well-list/wellListColumnLabels'

/** Map CSV columns that are not on the Wells list grid (or differ in shape, for example contact columns). */
export const WellMapCsvOnlyLabels = {
  wellDetailPage: 'Well detail page',
  enrichmentFailed: 'Enrichment failed',
  measuringPoint: 'Measuring Point',
  contactName: 'Contact name',
  email: 'Email',
  phone: 'Phone',
  monitoringFrequency: 'Monitoring Frequency',
  measuredFor: 'Measured For',
  lastVisitDate: 'Last Visit Date',
  firstVisitStaff: 'First Visit Staff',
  county: 'County',
  state: 'State',
  quadName: 'Quad name',
  groups: 'Groups',
  wellPurposes: 'Well purposes',
  casingDiameter: 'Casing Diameter',
  casingDepth: 'Casing Depth',
  casingMaterials: 'Casing Materials',
  pumpType: 'Pump Type',
  pumpDepth: 'Pump Depth',
  elevation: 'Elevation',
  elevationMethod: 'Elevation Method',
  verticalDatum: 'Vertical Datum',
  dataloggerSuitability: 'Datalogger Suitability',
  depthSource: 'Depth Source',
  historicDepthToWater: 'Historic Depth to Water',
  constructionMethod: 'Construction Method',
  formationCompletionCode: 'Formation Completion Code',
  aquiferTypes: 'Aquifer types',
  measuringPointHeight: 'Measuring point height',
  measuringPointDescription: 'Measuring point description',
  utmZone: 'UTM zone',
  utmEasting: 'UTM easting',
  utmNorthing: 'UTM northing',
  locationNotes: 'Location notes',
  generalNotes: 'General notes',
  siteNotes: 'Site notes',
  constructionNotes: 'Construction notes',
  waterNotes: 'Water notes',
  permissions: 'Permissions',
  fullWellJson: 'Full well JSON',
} as const

/** OGC / map feature keys omitted from CSV (IDs and layer name duplicate other fields). */
export const MAP_CSV_DROPPED_FEATURE_KEYS = [
  'name',
  'id',
  'thing_name',
  'thing_id',
  'well_id',
] as const

/** Reserved for optional leading columns from the map layer; empty means none. */
export const MAP_CSV_OGC_LEADING_KEYS: readonly string[] = []

export const WELL_MAP_CSV_COLUMN_HEADERS_EXPLICIT: readonly string[] = [
  WellListColumnLabels.wellId,
  WellListColumnLabels.name,
  WellMapCsvOnlyLabels.wellDetailPage,
  WellListColumnLabels.siteName,
  WellListColumnLabels.holeDepthFt,
  WellListColumnLabels.wellDepthFt,
  WellMapCsvOnlyLabels.measuringPoint,
  WellMapCsvOnlyLabels.contactName,
  WellMapCsvOnlyLabels.email,
  WellMapCsvOnlyLabels.phone,
  WellListColumnLabels.wellStatus,
  WellListColumnLabels.monitoring,
  WellListColumnLabels.createdAt,
  WellListColumnLabels.type,
  WellListColumnLabels.aquifers,
  WellListColumnLabels.releaseStatus,
  WellMapCsvOnlyLabels.monitoringFrequency,
  WellMapCsvOnlyLabels.measuredFor,
  WellMapCsvOnlyLabels.lastVisitDate,
  WellListColumnLabels.firstVisit,
  WellMapCsvOnlyLabels.firstVisitStaff,
  WellMapCsvOnlyLabels.county,
  WellMapCsvOnlyLabels.state,
  WellMapCsvOnlyLabels.quadName,
  WellListColumnLabels.alternateIds,
  WellMapCsvOnlyLabels.groups,
  WellMapCsvOnlyLabels.wellPurposes,
  WellMapCsvOnlyLabels.casingDiameter,
  WellMapCsvOnlyLabels.casingDepth,
  WellMapCsvOnlyLabels.casingMaterials,
  WellMapCsvOnlyLabels.pumpType,
  WellMapCsvOnlyLabels.pumpDepth,
  WellMapCsvOnlyLabels.elevation,
  WellMapCsvOnlyLabels.elevationMethod,
  WellMapCsvOnlyLabels.verticalDatum,
  WellMapCsvOnlyLabels.dataloggerSuitability,
  WellListColumnLabels.driller,
  WellListColumnLabels.latitude,
  WellListColumnLabels.longitude,
  WellMapCsvOnlyLabels.depthSource,
  WellMapCsvOnlyLabels.historicDepthToWater,
  WellListColumnLabels.completed,
  WellMapCsvOnlyLabels.constructionMethod,
  WellMapCsvOnlyLabels.measuringPointHeight,
  WellMapCsvOnlyLabels.measuringPointDescription,
  WellMapCsvOnlyLabels.formationCompletionCode,
  WellMapCsvOnlyLabels.aquiferTypes,
  WellMapCsvOnlyLabels.locationNotes,
  WellMapCsvOnlyLabels.generalNotes,
  WellMapCsvOnlyLabels.siteNotes,
  WellMapCsvOnlyLabels.constructionNotes,
  WellMapCsvOnlyLabels.waterNotes,
  WellMapCsvOnlyLabels.permissions,
  WellMapCsvOnlyLabels.utmZone,
  WellMapCsvOnlyLabels.utmEasting,
  WellMapCsvOnlyLabels.utmNorthing,
  WellMapCsvOnlyLabels.fullWellJson,
]

/** Full preferred CSV column order for visible features export (OGC keys, then well columns). */
export function buildMapExportPreferredColumnOrder(): string[] {
  return [...MAP_CSV_OGC_LEADING_KEYS, ...WELL_MAP_CSV_COLUMN_HEADERS_EXPLICIT]
}

/**
 * Site name for CSV: API `site_name`, else OGC map `site_name`, else text from
 * Unknown-organization alternate IDs (same strings users used to read from "Alternate IDs").
 */
export function deriveSiteNameColumn(
  well: IWell,
  ogcSiteName?: string | number | null
): string {
  const fromApi = well.site_name?.trim()
  if (fromApi) return fromApi
  if (ogcSiteName != null && String(ogcSiteName).trim() !== '') {
    return String(ogcSiteName).trim()
  }
  const unknownLabels = (well.alternate_ids ?? [])
    .filter(
      (link) =>
        (link.alternate_organization || '').toUpperCase().trim() === 'UNKNOWN'
    )
    .map((link) => link.alternate_id?.trim())
    .filter(Boolean) as string[]
  if (unknownLabels.length) return unknownLabels.join(' ; ')
  return ''
}

/** Remove legacy `detail_*` keys from older exports or cached features. */
export function stripLegacyDetailPrefixedKeys(
  properties: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(properties).filter(([k]) => !k.startsWith('detail_'))
  )
}

export function dropMapCsvExcludedFeatureKeys(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...properties }
  for (const k of MAP_CSV_DROPPED_FEATURE_KEYS) {
    delete out[k]
  }
  return out
}

function formatMeasuringPointLikeCoreCard(well: IWell): string {
  const parts = [
    well?.measuring_point_description?.trim() || null,
    well?.measuring_point_height != null
      ? `${well.measuring_point_height} ${well.measuring_point_height_unit ?? ''}`.trim()
      : null,
  ].filter(Boolean)
  return parts.join(' | ')
}

function measuredForLabel(firstVisitDate: string | null | undefined): string {
  if (!firstVisitDate) return ''
  const start = new Date(firstVisitDate)
  if (Number.isNaN(start.getTime())) return ''
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  if (totalMonths <= 0) return 'Less than a month'
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
}

function formatMonitoringFrequencies(well: IWell): string {
  const freqs = well.monitoring_frequencies ?? []
  if (freqs.length === 0) return ''
  return freqs
    .map((f) => {
      const end = f.end_date ? ` - ${formatAppDate(f.end_date)}` : ''
      return `${f.monitoring_frequency} ${formatAppDate(f.start_date)}${end}`
    })
    .join(' ; ')
}

function formatFirstVisitStaff(details: IWellDetails): string {
  const parts =
    details.first_field_event?.field_event_participants?.map((p) => {
      const n = p.participant?.name || 'Unknown'
      return p.participant_role ? `${n} (${p.participant_role})` : n
    }) ?? []
  return parts.join(', ')
}

function formatContactTriple(contacts: IContact[] | undefined): Record<
  string,
  string
> {
  if (!contacts?.length) {
    return {
      [WellMapCsvOnlyLabels.contactName]: '',
      [WellMapCsvOnlyLabels.email]: '',
      [WellMapCsvOnlyLabels.phone]: '',
    }
  }

  const names = contacts
    .map((c) => c.name?.trim() ?? '')
    .filter(Boolean)
    .join(', ')

  const emails = contacts
    .map((c) =>
      (c.emails ?? [])
        .map((e) => e.email?.trim())
        .filter(Boolean)
        .join(', ')
    )
    .filter(Boolean)
    .join(', ')

  const phones = contacts
    .map((c) =>
      (c.phones ?? [])
        .map((p) => p.phone_number?.trim())
        .filter(Boolean)
        .join(', ')
    )
    .filter(Boolean)
    .join(', ')

  return {
    [WellMapCsvOnlyLabels.contactName]: names,
    [WellMapCsvOnlyLabels.email]: emails,
    [WellMapCsvOnlyLabels.phone]: phones,
  }
}

function stringifyNotes(well: IWell, key: keyof IWell): string {
  const notes = well[key]
  if (!Array.isArray(notes)) return ''
  return notes
    .map((n: { content?: string }) => n?.content)
    .filter(Boolean)
    .join(' | ')
}

export type WellMapCsvBuildOptions = {
  /** OGC / map feature `site_name` when API `site_name` is null */
  ogcSiteName?: string | number | null
}

/** Values for one well row: keys are CSV headers. List-aligned titles use `WellListColumnLabels`. */
export function buildWellMapCsvValues(
  details: IWellDetails,
  options?: WellMapCsvBuildOptions
): Record<string, string> {
  const { well, contacts } = details
  const locProps = well.current_location?.properties as
    | Record<string, unknown>
    | undefined

  const elevationNum =
    typeof locProps?.elevation === 'number' ? locProps.elevation : null
  const utm = locProps?.utm_coordinates as Record<string, unknown> | undefined

  const lastVisit = details.field_events?.[0]?.event_date

  const holeDisplay = well.hole_depth
    ? `${well.hole_depth} ${well.hole_depth_unit ?? ''}`.trim()
    : ''
  const wellDepthDisplay = well.well_depth
    ? `${well.well_depth} ${well.well_depth_unit ?? ''}`.trim()
    : ''

  const casingDiam =
    well.well_casing_diameter != null
      ? `${well.well_casing_diameter} ${well.well_casing_diameter_unit ?? ''}`.trim()
      : ''
  const casingDepth =
    well.well_casing_depth != null
      ? `${well.well_casing_depth} ${well.well_casing_depth_unit ?? ''}`.trim()
      : ''
  const pumpDepth =
    well.well_pump_depth != null
      ? `${well.well_pump_depth} ${well.well_pump_depth_unit ?? ''}`.trim()
      : ''

  const elevDisplay =
    elevationNum != null
      ? `${elevationNum.toFixed(2)} ${String(locProps?.elevation_unit ?? '')}`.trim()
      : ''

  const dataloggerVal =
    (well as IWell & { datalogger_suitability_status?: string | null })
      .datalogger_suitability_status ??
    (well.is_suitable_for_datalogger != null
      ? String(well.is_suitable_for_datalogger)
      : '')

  const row: Record<string, string> = {
    [WellListColumnLabels.wellId]: String(well.id),
    [WellListColumnLabels.name]: well.name ?? '',
    [WellMapCsvOnlyLabels.wellDetailPage]: buildWellShowAbsoluteUrl(well.id),
    [WellListColumnLabels.siteName]: deriveSiteNameColumn(well, options?.ogcSiteName),
    [WellListColumnLabels.holeDepthFt]: holeDisplay,
    [WellListColumnLabels.wellDepthFt]: wellDepthDisplay,
    [WellMapCsvOnlyLabels.measuringPoint]: formatMeasuringPointLikeCoreCard(well),
    ...formatContactTriple(contacts),
    [WellListColumnLabels.wellStatus]: well.well_status ?? '',
    [WellListColumnLabels.monitoring]: well.monitoring_status ?? '',
    [WellListColumnLabels.createdAt]: formatAppDate(well.created_at) || '',
    [WellListColumnLabels.type]: well.thing_type ?? '',
    [WellListColumnLabels.aquifers]: (well.aquifers ?? [])
      .map((a) => a.aquifer_system)
      .filter(Boolean)
      .join(', '),
    [WellListColumnLabels.releaseStatus]: String(well.release_status ?? ''),
    [WellMapCsvOnlyLabels.monitoringFrequency]: formatMonitoringFrequencies(well),
    [WellMapCsvOnlyLabels.measuredFor]: measuredForLabel(well.first_visit_date),
    [WellMapCsvOnlyLabels.lastVisitDate]: formatAppDate(lastVisit) || '',
    [WellListColumnLabels.firstVisit]: formatAppDate(well.first_visit_date) || '',
    [WellMapCsvOnlyLabels.firstVisitStaff]: formatFirstVisitStaff(details),
    [WellMapCsvOnlyLabels.county]: String(locProps?.county ?? ''),
    [WellMapCsvOnlyLabels.state]: String(locProps?.state ?? ''),
    [WellMapCsvOnlyLabels.quadName]: String(locProps?.quad_name ?? ''),
    [WellListColumnLabels.alternateIds]: (well.alternate_ids ?? [])
      .map(
        (link) =>
          `${link.alternate_organization ?? ''}: ${link.alternate_id ?? ''}`
      )
      .join(', '),
    [WellMapCsvOnlyLabels.groups]: (well.groups ?? [])
      .map((g) => g.name)
      .filter(Boolean)
      .join('; '),
    [WellMapCsvOnlyLabels.wellPurposes]: (well.well_purposes ?? []).join('; '),
    [WellMapCsvOnlyLabels.casingDiameter]: casingDiam,
    [WellMapCsvOnlyLabels.casingDepth]: casingDepth,
    [WellMapCsvOnlyLabels.casingMaterials]: (well.well_casing_materials ?? []).join(
      ', '
    ),
    [WellMapCsvOnlyLabels.pumpType]: well.well_pump_type ?? '',
    [WellMapCsvOnlyLabels.pumpDepth]: pumpDepth,
    [WellMapCsvOnlyLabels.elevation]: elevDisplay,
    [WellMapCsvOnlyLabels.elevationMethod]: String(locProps?.elevation_method ?? ''),
    [WellMapCsvOnlyLabels.verticalDatum]: String(locProps?.vertical_datum ?? ''),
    [WellMapCsvOnlyLabels.dataloggerSuitability]: dataloggerVal,
    [WellListColumnLabels.driller]: well.well_driller_name ?? '',
    [WellListColumnLabels.latitude]:
      well.current_location?.geometry?.coordinates?.[1] != null
        ? String(well.current_location.geometry.coordinates[1])
        : '',
    [WellListColumnLabels.longitude]:
      well.current_location?.geometry?.coordinates?.[0] != null
        ? String(well.current_location.geometry.coordinates[0])
        : '',
    [WellMapCsvOnlyLabels.depthSource]: well.well_depth_source ?? '',
    [WellMapCsvOnlyLabels.historicDepthToWater]:
      (well.historic_depth_to_water?.length ?? 0) > 0
        ? (well.historic_depth_to_water ?? []).join(', ')
        : '',
    [WellListColumnLabels.completed]:
      formatAppDate(well.well_completion_date) || '',
    [WellMapCsvOnlyLabels.constructionMethod]: well.well_construction_method ?? '',
    [WellMapCsvOnlyLabels.measuringPointHeight]: String(
      well.measuring_point_height ?? ''
    ),
    [WellMapCsvOnlyLabels.measuringPointDescription]:
      well.measuring_point_description ?? '',
    [WellMapCsvOnlyLabels.formationCompletionCode]:
      well.formation_completion_code ?? '',
    [WellMapCsvOnlyLabels.aquiferTypes]:
      well.aquifers && well.aquifers.length > 0
        ? [...new Set(well.aquifers.flatMap((a) => a.aquifer_types))].join(', ')
        : '',
    [WellMapCsvOnlyLabels.locationNotes]: String(locProps?.nma_location_notes ?? ''),
    [WellMapCsvOnlyLabels.generalNotes]: stringifyNotes(well, 'general_notes'),
    [WellMapCsvOnlyLabels.siteNotes]: stringifyNotes(well, 'site_notes'),
    [WellMapCsvOnlyLabels.constructionNotes]: stringifyNotes(well, 'construction_notes'),
    [WellMapCsvOnlyLabels.waterNotes]: stringifyNotes(well, 'water_notes'),
    [WellMapCsvOnlyLabels.permissions]: JSON.stringify(well.permissions ?? []),
    [WellMapCsvOnlyLabels.utmZone]: utm?.utm_zone != null ? String(utm.utm_zone) : '',
    [WellMapCsvOnlyLabels.utmEasting]:
      utm?.easting != null ? String(utm.easting) : '',
    [WellMapCsvOnlyLabels.utmNorthing]:
      utm?.northing != null ? String(utm.northing) : '',
    [WellMapCsvOnlyLabels.fullWellJson]: JSON.stringify(well),
  }

  return row
}

export function buildWellMapCsvEnrichmentFailedValues(
  thingId: string,
  options?: WellMapCsvBuildOptions
): Record<string, string> {
  const fromOgc =
    options?.ogcSiteName != null && String(options.ogcSiteName).trim() !== ''
      ? String(options.ogcSiteName).trim()
      : ''
  return {
    [WellListColumnLabels.wellId]: thingId,
    [WellMapCsvOnlyLabels.wellDetailPage]: buildWellShowAbsoluteUrl(thingId),
    [WellMapCsvOnlyLabels.enrichmentFailed]: 'Yes',
    [WellListColumnLabels.siteName]: fromOgc,
  }
}
