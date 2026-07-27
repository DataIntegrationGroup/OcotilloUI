import type { IWell } from '@/interfaces/geothermal'

// A not-yet-saved well being inventoried. well_data_id / thing_id are
// server-assigned, so drafts hold only the user-entered fields.
export type WellDraft = Partial<Omit<IWell, 'well_data_id' | 'thing_id'>>

export type FieldKind = 'text' | 'number' | 'dropdown' | 'boolean'

export interface FieldSpec {
  id: keyof WellDraft
  header: string
  group: string
  kind: FieldKind
  description: string
  options?: string[]
  required?: boolean
  /** 7-decimal coordinate display. */
  coord?: boolean
  /** Extra per-value validation (empty is handled by `required`). */
  validate?: (value: unknown) => string | undefined
}

const NS = ['N', 'S']
const EW = ['E', 'W']

/** Structured API number, e.g. 30-039-05212 (state-county-well). */
export function validateApi(value: unknown): string | undefined {
  const s = String(value).trim()
  return /^\d{2}-\d{3}-\d{4,5}$/.test(s) ? undefined : 'Format: SS-CCC-NNNNN'
}

export interface ParsedApi {
  stateCode: string
  countyCode: string
  wellId: string
}

export function parseApi(value: string): ParsedApi | null {
  const m = String(value)
    .trim()
    .match(/^(\d{2})-(\d{3})-(\d{4,5})$/)
  if (!m) return null
  return { stateCode: m[1], countyCode: m[2], wellId: m[3] }
}

// Single source of truth for every editable well field. All derived maps
// (headers, tooltips, options, required set, number/boolean fields) come from
// here. PROVISIONAL — see IWell.
export const FIELD_SPECS: FieldSpec[] = [
  // ── Identity ──
  { id: 'name', header: 'Name', group: 'Identity', kind: 'text', description: 'Well name / identifier', required: true },
  { id: 'api', header: 'API', group: 'Identity', kind: 'text', description: 'API well number (SS-CCC-NNNNN, e.g. 30-039-05212)', required: true, validate: validateApi },
  { id: 'api_suffix', header: 'API suffix', group: 'Identity', kind: 'text', description: 'API suffix' },
  { id: 'well_number', header: 'Well #', group: 'Identity', kind: 'text', description: 'Well number' },
  { id: 'import_id', header: 'Import ID', group: 'Identity', kind: 'text', description: 'Source import identifier' },
  { id: 'import_db', header: 'Import DB', group: 'Identity', kind: 'text', description: 'Source import database' },
  // guid is server-assigned — not a user field.

  // ── Classification ──
  { id: 'well_class', header: 'Class', group: 'Classification', kind: 'dropdown', description: 'Well class', options: ['Oil & Gas', 'Water', 'Geothermal'] },
  { id: 'well_type', header: 'Type', group: 'Classification', kind: 'dropdown', description: 'Well type', options: ['Wildcat', 'Production', 'Exploration', 'Gas', 'Oil'], required: true },
  { id: 'well_orient', header: 'Orientation', group: 'Classification', kind: 'dropdown', description: 'Well orientation', options: ['vertical', 'deviated', 'horizontal'] },
  { id: 'status', header: 'Status', group: 'Classification', kind: 'dropdown', description: 'Well status', options: ['New', 'Active', 'Abandoned', 'Plugged'] },

  // ── Operator ──
  { id: 'operator', header: 'Operator', group: 'Operator', kind: 'text', description: 'Current operator company' },
  { id: 'owner', header: 'Owner', group: 'Operator', kind: 'text', description: 'Current owner' },
  { id: 'prd_pool_count', header: 'Pool count', group: 'Operator', kind: 'number', description: 'Producing pool count' },

  // ── Depth ──
  { id: 'total_depth', header: 'Total Depth (ft)', group: 'Depth', kind: 'number', description: 'Total (measured) depth, in feet' },
  { id: 'well_tvd', header: 'TVD (ft)', group: 'Depth', kind: 'number', description: 'True vertical depth, in feet' },
  { id: 'plug_back', header: 'Plug back (ft)', group: 'Depth', kind: 'number', description: 'Plug-back depth, in feet' },
  { id: 'fm_td', header: 'Fm @ TD', group: 'Depth', kind: 'text', description: 'Formation at total depth' },
  { id: 'age_td', header: 'Age @ TD', group: 'Depth', kind: 'text', description: 'Age at total depth' },

  // ── Dates ──
  { id: 'spud_date', header: 'Spud', group: 'Dates', kind: 'text', description: 'Spud date (ISO, e.g. 1956-06-07)' },
  { id: 'completion_date', header: 'Completion', group: 'Dates', kind: 'text', description: 'Completion date (ISO)' },
  { id: 'plug_date', header: 'Plug', group: 'Dates', kind: 'text', description: 'Plug date (ISO)' },

  // ── Location ──
  { id: 'latitude', header: 'Latitude', group: 'Location', kind: 'number', description: 'Latitude in decimal degrees', coord: true, required: true },
  { id: 'longitude', header: 'Longitude', group: 'Location', kind: 'number', description: 'Longitude in decimal degrees', coord: true, required: true },
  { id: 'source_datum', header: 'Datum', group: 'Location', kind: 'dropdown', description: 'Datum the lat/lon are in', options: ['NAD27', 'NAD83', 'WGS84'] },
  { id: 'basin', header: 'Basin', group: 'Location', kind: 'text', description: 'Geologic basin' },
  { id: 'county', header: 'County', group: 'Location', kind: 'text', description: 'County — server-derived from lat/lon when blank' },
  { id: 'state', header: 'State', group: 'Location', kind: 'text', description: 'State — server-derived from lat/lon when blank (default NM)' },

  // ── PLSS ──
  { id: 'township', header: 'Township', group: 'PLSS', kind: 'number', description: 'PLSS township' },
  { id: 'township_dir', header: 'T dir', group: 'PLSS', kind: 'dropdown', description: 'Township direction', options: NS },
  { id: 'range', header: 'Range', group: 'PLSS', kind: 'number', description: 'PLSS range' },
  { id: 'range_dir', header: 'R dir', group: 'PLSS', kind: 'dropdown', description: 'Range direction', options: EW },
  { id: 'section', header: 'Section', group: 'PLSS', kind: 'number', description: 'PLSS section' },
  { id: 'unit_letter', header: 'Unit', group: 'PLSS', kind: 'text', description: 'PLSS unit letter' },
  { id: 'section_part', header: 'Sec part', group: 'PLSS', kind: 'text', description: 'Section part (e.g. SE-SE)' },
  { id: 'footage_ns', header: 'Ftg NS', group: 'PLSS', kind: 'number', description: 'Footage north/south' },
  { id: 'footage_ns_dir', header: 'NS dir', group: 'PLSS', kind: 'dropdown', description: 'Footage NS direction', options: NS },
  { id: 'footage_ew', header: 'Ftg EW', group: 'PLSS', kind: 'number', description: 'Footage east/west' },
  { id: 'footage_ew_dir', header: 'EW dir', group: 'PLSS', kind: 'dropdown', description: 'Footage EW direction', options: EW },
  { id: 'utm_zone', header: 'UTM zone', group: 'PLSS', kind: 'text', description: 'UTM zone' },

  // ── Location accuracy ──
  { id: 'loc_acc_type', header: 'Acc type', group: 'Accuracy', kind: 'text', description: 'Location accuracy type' },
  { id: 'loc_acc_meas', header: 'Acc meas', group: 'Accuracy', kind: 'text', description: 'Location accuracy measure' },
  { id: 'loc_acc_val', header: 'Acc val', group: 'Accuracy', kind: 'text', description: 'Location accuracy value' },

  // ── Data-existence flags ──
  { id: 'scout_ticket', header: 'Scout', group: 'Data flags', kind: 'boolean', description: 'Scout ticket exists' },
  { id: 'downhole_survey', header: 'Dwn hole', group: 'Data flags', kind: 'boolean', description: 'Downhole survey exists' },
  { id: 'geo_log', header: 'Geo log', group: 'Data flags', kind: 'boolean', description: 'Geologic log exists' },
  { id: 'geophys_log', header: 'Geophys', group: 'Data flags', kind: 'boolean', description: 'Geophysical log exists' },
  { id: 'has_geothermal_data', header: 'Geothermal', group: 'Data flags', kind: 'boolean', description: 'Geothermal data exists' },
  { id: 'petro_data', header: 'Petro', group: 'Data flags', kind: 'boolean', description: 'Petrophysical data exists' },
  { id: 'core_exists', header: 'Core', group: 'Data flags', kind: 'boolean', description: 'Core exists' },
  { id: 'cuttings', header: 'Cuttings', group: 'Data flags', kind: 'boolean', description: 'Cuttings exist' },
  { id: 'sample_data', header: 'Samples', group: 'Data flags', kind: 'boolean', description: 'Sample data exists' },
]

export const ALL_FIELDS: (keyof WellDraft)[] = FIELD_SPECS.map((s) => s.id)
export const NUMBER_FIELDS = new Set<keyof WellDraft>(
  FIELD_SPECS.filter((s) => s.kind === 'number').map((s) => s.id)
)
export const BOOLEAN_FIELDS = new Set<keyof WellDraft>(
  FIELD_SPECS.filter((s) => s.kind === 'boolean').map((s) => s.id)
)

/** Round a coordinate to 7 decimal places for display (value unchanged). */
export function formatCoord(n: number): string {
  return Number(n.toFixed(7)).toString()
}

/** Validate a draft: required-empty + per-field validators. field → message. */
export function validateDraft(r: WellDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const spec of FIELD_SPECS) {
    const v = r[spec.id]
    const empty = v == null || v === ''
    if (spec.required && empty) {
      errors[spec.id] = 'Required'
      continue
    }
    if (spec.validate && !empty) {
      const e = spec.validate(v)
      if (e) errors[spec.id] = e
    }
  }
  return errors
}

export function isBlankDraft(r: WellDraft): boolean {
  return ALL_FIELDS.every((k) => {
    const v = r[k]
    return v == null || v === '' || v === false
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
