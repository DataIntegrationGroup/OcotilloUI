import type { ChemistryDisplayTabKey } from '@/interfaces/ocotillo'

export enum GroupType {
  Wells = 'Wells',
  Springs = 'Springs',
  Contacts = 'Contacts',
  Messages = 'Messages',
  Assets = 'Assets',
  Projects = 'Projects',
}

export const INCHES_IN_A_FOOT = 12

export const MAX_UPLOAD_SIZE_IN_MB = 250
export const MAX_UPLOAD_SIZE_IN_BYTES = MAX_UPLOAD_SIZE_IN_MB * 1024 * 1024

export const ALLOWED_FILE_EXTENSIONS = [
  'jpg',
  'png',
  'gif',
  'webp',
  'tiff',
  'pdf',
  'txt',
] as const

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'application/pdf',
  'text/plain',
])

export type StandardFilter =
  | 'all'
  | 'above_mcl'
  | 'above_smcl'
  | 'any_epa_flag'
  | 'non_detects'

export type ChemistryViewMode = 'current' | 'crosstab'

export const TAB_OPTIONS: {
  key: ChemistryDisplayTabKey
  label: string
}[] = [
  { key: 'field_parameters', label: 'Field Parameters' },
  { key: 'general_chemistry', label: 'General Chemistry' },
  { key: 'environmental_tracers', label: 'Environmental Tracers' },
  { key: 'additional_analyses', label: 'Additional Analyses' },
]

export const STANDARD_FILTER_OPTIONS: {
  value: StandardFilter
  label: string
}[] = [
  { value: 'all', label: 'All parameters' },
  { value: 'above_mcl', label: 'Above MCL only' },
  { value: 'above_smcl', label: 'Above SMCL only' },
  { value: 'any_epa_flag', label: 'Any EPA flag' },
  { value: 'non_detects', label: 'Non-detects only' },
]

export const VIEW_OPTIONS: { value: ChemistryViewMode; label: string }[] = [
  { value: 'current', label: 'Current tab' },
  { value: 'crosstab', label: 'Cross-tab for all views' },
]

export const CROSSTAB_ONLY_TABS = new Set<ChemistryDisplayTabKey>([
  'general_chemistry',
  'environmental_tracers',
  'additional_analyses',
])

export const FIELD_PARAMETER_DEFINITIONS = [
  {
    key: 'dissolved_oxygen',
    label: 'Dissolved Oxygen',
    aliases: ['do', 'dissolved oxygen'],
  },
  {
    key: 'orp_redox',
    label: 'ORP / Redox',
    aliases: ['orp', 'redox', 'orp redox', 'oxidation reduction potential'],
  },
  { key: 'ph', label: 'pH', aliases: ['ph'] },
  {
    key: 'specific_conductance',
    label: 'Specific Conductance',
    aliases: [
      'cf',
      'specific conductance',
      'specific conductivity',
      'conductivity',
    ],
  },
  {
    key: 'temperature',
    label: 'Temperature',
    aliases: ['temperature', 'temperture', 'temp'],
  },
] as const

export const FIELD_PARAMETER_ORDER = new Map<string, number>(
  FIELD_PARAMETER_DEFINITIONS.map((parameter, index) => [
    parameter.label,
    index,
  ]),
)

export const GENERAL_PARAMETERS = new Set([
  'arsenic',
  'bicarbonate',
  'calcium',
  'chloride',
  'fluoride',
  'ion balance',
  'iron',
  'magnesium',
  'manganese',
  'nitrate (as n)',
  'potassium',
  'sodium',
  'sulfate',
  'total dissolved solids',
  'ph',
  'uranium (total, by icp-ms)',
  'uranium, total, unfiltered',
])

export const TRACER_SYMBOLS = new Set([
  '3h',
  'h2r',
  'o18r',
  'o17r',
  'c13r',
  'c14',
  'c14_years',
  'sf6',
  'cfc11',
  'cfc12',
  'cfc113',
  'cfc113_12',
  'sr87:sr86',
  'd18o-so4',
  'd34s-so4',
])
