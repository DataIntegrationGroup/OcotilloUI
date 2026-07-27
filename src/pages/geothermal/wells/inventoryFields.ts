import type { IWell } from '@/interfaces/geothermal'

// A not-yet-saved well being inventoried. well_data_id / thing_id are
// server-assigned, so drafts hold only the user-entered fields.
export type WellDraft = Partial<Omit<IWell, 'well_data_id' | 'thing_id'>>

// Fields the user fills when inventorying a new well (everything except the
// server-assigned id). Enum fields (well_class/well_type/status) are plain text
// in P1–P3 — dropdowns land in P4.
export const TEXT_FIELDS: (keyof WellDraft)[] = [
  'name',
  'api',
  'well_number',
  'well_class',
  'well_type',
  'status',
  'operator',
  'owner',
  'completion_date',
  'has_geothermal_data',
  'county',
  'state',
]

export const NUMBER_FIELDS: (keyof WellDraft)[] = [
  'total_depth',
  'latitude',
  'longitude',
]

export const ALL_FIELDS: (keyof WellDraft)[] = [...TEXT_FIELDS, ...NUMBER_FIELDS]

export const HEADERS: Record<keyof WellDraft, string> = {
  name: 'Name',
  api: 'API',
  well_number: 'Well #',
  well_class: 'Class',
  well_type: 'Type',
  status: 'Status',
  operator: 'Operator',
  owner: 'Owner',
  completion_date: 'Completion',
  has_geothermal_data: 'Geo data?',
  county: 'County',
  state: 'State',
  total_depth: 'Total Depth (ft)',
  latitude: 'Latitude',
  longitude: 'Longitude',
}

// Allowed values for the enum (dropdown) fields.
// PROVISIONAL — observed from the live data (8 wells); confirm the full lists
// with the backend once the contract lands.
export const ENUM_OPTIONS: Partial<Record<keyof WellDraft, string[]>> = {
  well_type: ['Wildcat', 'Production', 'Exploration'],
  well_class: ['Oil & Gas'],
  status: ['Active', 'Abandoned', 'Plugged'],
}

// Fields required to create a well. county/state are intentionally NOT
// required — the backend reverse-geocodes them from lat/lon when left blank
// (auto-fill empty only), so latitude/longitude are the required location
// inputs instead.
// PROVISIONAL — the create schema isn't in the (stripped) OpenAPI; confirm the
// real required set with the backend.
export const REQUIRED_FIELDS: (keyof WellDraft)[] = [
  'name',
  'api',
  'well_type',
  'latitude',
  'longitude',
]

/** Required fields that are empty on a draft, keyed field → message. */
export function missingRequired(r: WellDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of REQUIRED_FIELDS) {
    const v = r[f]
    if (v == null || v === '') errors[f] = 'Required'
  }
  return errors
}

/** Round a coordinate to 7 decimal places for display (value unchanged). */
export function formatCoord(n: number): string {
  return Number(n.toFixed(7)).toString()
}

export function isBlankDraft(r: WellDraft): boolean {
  return ALL_FIELDS.every((k) => {
    const v = r[k]
    return v == null || v === ''
  })
}

// Drop empty fields so the create payload carries only what the user entered.
export function cleanDraft(r: WellDraft): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(r)) {
    if (v !== null && v !== '' && v !== undefined) out[k] = v
  }
  return out
}
