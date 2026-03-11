import { parseNumeric } from './parseNumeric'

type GeoJsonFeature = any

const EXCLUDED_SELECTED_POINT_COLUMNS = new Set([
  'thing_type',
  'thing_id',
  'well_id',
  'id',
  'observation_id',
  'major_chemistry_id',
])

const MAJOR_CHEMISTRY_SYNTHETIC_COLUMNS = [
  'name',
  'latest_chemistry_date',
  'analyte_count',
  'sodium_display',
  'potassium_display',
  'calcium_display',
  'magnesium_display',
  'chloride_display',
  'sulfate_display',
  'bicarbonate_display',
] as const

const MAJOR_CHEMISTRY_DISPLAY_COLUMNS = {
  sodium_display: { valueKey: 'sodium', unitKey: 'sodium_units', label: 'Na' },
  potassium_display: {
    valueKey: 'potassium',
    unitKey: 'potassium_units',
    label: 'K',
  },
  calcium_display: {
    valueKey: 'calcium',
    unitKey: 'calcium_units',
    label: 'Ca',
  },
  magnesium_display: {
    valueKey: 'magnesium',
    unitKey: 'magnesium_units',
    label: 'Mg',
  },
  chloride_display: {
    valueKey: 'chloride',
    unitKey: 'chloride_units',
    label: 'Cl',
  },
  sulfate_display: {
    valueKey: 'sulfate',
    unitKey: 'sulfate_units',
    label: 'SO4',
  },
  bicarbonate_display: {
    valueKey: 'bicarbonate',
    unitKey: 'bicarbonate_units',
    label: 'HCO3',
  },
} as const

const MINOR_CHEMISTRY_ANALYTES = [
  ['h2r', 'H2R'],
  ['o18r', 'O18R'],
  ['c13r', 'C13R'],
  ['c14', 'C14'],
  ['c14_years', 'C14 Years'],
  ['fluoride', 'Fluoride'],
  ['barium', 'Barium'],
  ['barium_total', 'Barium Total'],
  ['copper', 'Copper'],
  ['copper_total', 'Copper Total'],
  ['zinc', 'Zinc'],
  ['zinc_total', 'Zinc Total'],
  ['molybdenum', 'Molybdenum'],
  ['molybdenum_total', 'Molybdenum Total'],
  ['silica', 'Silica'],
  ['silicon', 'Silicon'],
  ['silicon_total', 'Silicon Total'],
  ['manganese', 'Manganese'],
  ['manganese_total', 'Manganese Total'],
  ['iron', 'Iron'],
  ['iron_total', 'Iron Total'],
  ['strontium', 'Strontium'],
  ['strontium_total', 'Strontium Total'],
  ['chromium', 'Chromium'],
  ['chromium_total', 'Chromium Total'],
  ['boron', 'Boron'],
  ['boron_total', 'Boron Total'],
  ['uranium', 'Uranium'],
  ['uranium_total', 'Uranium Total'],
  ['lithium', 'Lithium'],
  ['lithium_total', 'Lithium Total'],
  ['silver', 'Silver'],
  ['silver_total', 'Silver Total'],
  ['antimony', 'Antimony'],
  ['antimony_total', 'Antimony Total'],
  ['beryllium', 'Beryllium'],
  ['beryllium_total', 'Beryllium Total'],
  ['lead', 'Lead'],
  ['lead_total', 'Lead Total'],
  ['thallium', 'Thallium'],
  ['thallium_total', 'Thallium Total'],
  ['bromide', 'Bromide'],
  ['selenium', 'Selenium'],
  ['selenium_total', 'Selenium Total'],
  ['vanadium', 'Vanadium'],
  ['vanadium_total', 'Vanadium Total'],
  ['aluminum', 'Aluminum'],
  ['aluminum_total', 'Aluminum Total'],
  ['arsenic', 'Arsenic'],
  ['arsenic_total', 'Arsenic Total'],
  ['nickel', 'Nickel'],
  ['nickel_total', 'Nickel Total'],
  ['cadmium', 'Cadmium'],
  ['cadmium_total', 'Cadmium Total'],
  ['cobalt', 'Cobalt'],
  ['cobalt_total', 'Cobalt Total'],
  ['phosphate', 'Phosphate'],
  ['nitrite', 'Nitrite'],
  ['nitrate', 'Nitrate'],
  ['nitrate_as_n', 'Nitrate as N'],
  ['thorium', 'Thorium'],
  ['thorium_total', 'Thorium Total'],
  ['tin', 'Tin'],
  ['tin_total', 'Tin Total'],
  ['mercury', 'Mercury'],
  ['mercury_total', 'Mercury Total'],
  ['titanium', 'Titanium'],
  ['titanium_total', 'Titanium Total'],
] as const

const MINOR_CHEMISTRY_DISPLAY_COLUMNS = Object.fromEntries(
  MINOR_CHEMISTRY_ANALYTES.map(([key, label]) => [
    `${key}_display`,
    { valueKey: key, unitKey: `${key}_units`, label },
  ])
) as Record<string, { valueKey: string; unitKey: string; label: string }>

const MINOR_CHEMISTRY_SYNTHETIC_COLUMNS = [
  'name',
  'latest_chemistry_date',
  'analyte_count',
  ...MINOR_CHEMISTRY_ANALYTES.map(([key]) => `${key}_display`),
] as const

const CHEMISTRY_DISPLAY_COLUMNS = {
  ...MAJOR_CHEMISTRY_DISPLAY_COLUMNS,
  ...MINOR_CHEMISTRY_DISPLAY_COLUMNS,
} as const

const formatNumeric = (value: number): string => value.toFixed(2)
const formatInteger = (value: number): string => String(Math.round(value))

const formatDateTime = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsedDate)
}

const isDateLikeColumn = (column: string): boolean =>
  /date|datetime|timestamp/i.test(column)

const isCountLikeColumn = (column: string): boolean => /count/i.test(column)

export const getFeatureId = (feature: GeoJsonFeature): string | undefined => {
  const props = feature?.properties || {}
  const candidates = [
    props.thing_id,
    props.well_id,
    props.id,
    props.fid,
    props.feature_id,
    feature?.id,
  ]
  const value = candidates.find(
    (candidate) =>
      candidate !== undefined && candidate !== null && candidate !== ''
  )
  return value === undefined ? undefined : String(value)
}

export const getSelectedPointFeatures = (
  featureCollection: GeoJsonFeature,
  hasSelectionPolygon: boolean
): GeoJsonFeature[] => {
  if (!hasSelectionPolygon) return []

  const features = Array.isArray(featureCollection?.features)
    ? featureCollection.features
    : []

  return features.filter(
    (feature: GeoJsonFeature) => feature?.geometry?.type === 'Point'
  )
}

export const getSelectedPointColumns = (
  selectedPointFeatures: GeoJsonFeature[],
  selectedLayerKey?: string | null
): string[] => {
  if (selectedLayerKey === 'ogc-major-chemistry') {
    return [...MAJOR_CHEMISTRY_SYNTHETIC_COLUMNS]
  }

  if (selectedLayerKey === 'ogc-minor-chemistry') {
    return [...MINOR_CHEMISTRY_SYNTHETIC_COLUMNS]
  }

  const hasColumn = (key: string) =>
    selectedPointFeatures.some(
      (feature: GeoJsonFeature) => feature?.properties?.[key] !== undefined
    )

  const propertyKeys = [
    ...new Set<string>(
      selectedPointFeatures.flatMap((feature: GeoJsonFeature) =>
        (Object.keys(feature?.properties || {}) as string[]).filter(
          (key) =>
            !key.startsWith('__') && !EXCLUDED_SELECTED_POINT_COLUMNS.has(key)
        )
      )
    ),
  ]

  const preferredColumnsByLayer: Record<string, string[]> = {
    'ogc-average-tds': ['name'],
    'ogc-depth-to-water-trend': ['name'],
    'ogc-latest-depth-to-water': ['name', 'observation_datetime'],
    'ogc-latest-tds': ['name', 'observation_datetime'],
    'ogc-major-chemistry': ['name', 'latest_chemistry_date', 'analyte_count'],
    'ogc-minor-chemistry': ['name', 'latest_chemistry_date', 'analyte_count'],
    'ogc-water-elevation-points': ['name', 'observation_datetime'],
  }

  const preferredKeys = preferredColumnsByLayer[selectedLayerKey || ''] ?? [
    'name',
    'observation_datetime',
  ]
  const ordered = [
    ...preferredKeys.filter((key) => {
      if (key === 'name') {
        return hasColumn('name') || hasColumn('thing_name')
      }
      return propertyKeys.includes(key)
    }),
    ...propertyKeys.filter(
      (key) =>
        !preferredKeys.includes(key) &&
        key !== 'thing_name' &&
        key !== 'name'
    ),
  ]

  return ordered.slice(0, 5)
}

export const getSelectedPointIds = (
  selectedPointFeatures: GeoJsonFeature[]
): Set<string> =>
  new Set(
    selectedPointFeatures
      .map((feature) => getFeatureId(feature))
      .filter((featureId): featureId is string => Boolean(featureId))
  )

export const buildSelectedPointSourceData = ({
  sourceData,
  selectedPointIds,
}: {
  sourceData: GeoJsonFeature
  selectedPointIds: Set<string>
}) => {
  if (
    sourceData?.type !== 'FeatureCollection' ||
    !Array.isArray(sourceData.features)
  ) {
    return sourceData
  }

  return {
    ...sourceData,
    features: sourceData.features.map((feature: GeoJsonFeature) => {
      if (feature?.geometry?.type !== 'Point') return feature

      const featureId = getFeatureId(feature)
      return {
        ...feature,
        properties: {
          ...(feature?.properties || {}),
          __is_selected_point:
            featureId !== undefined && selectedPointIds.has(featureId) ? 1 : 0,
        },
      }
    }),
  }
}

export const buildSelectedPointPaint = (
  paint: Record<string, any> = {},
  mode: 'light' | 'dark' = 'light'
): Record<string, any> => ({
  ...paint,
  'circle-opacity': [
    'case',
    ['==', ['get', '__is_selected_point'], 1],
    1,
    paint['circle-opacity'] ?? 1,
  ],
  'circle-stroke-color': [
    'case',
    ['==', ['get', '__is_selected_point'], 1],
    mode === 'dark' ? '#f5f5f5' : '#111111',
    paint['circle-stroke-color'] ?? '#ffffff',
  ],
  'circle-stroke-opacity': [
    'case',
    ['==', ['get', '__is_selected_point'], 1],
    1,
    paint['circle-stroke-opacity'] ?? 1,
  ],
  'circle-stroke-width': [
    'case',
    ['==', ['get', '__is_selected_point'], 1],
    2.2,
    paint['circle-stroke-width'] ?? 1,
  ],
  'circle-radius': paint['circle-radius'] ?? 3,
})

export const formatSelectedPointCellValue = (
  column: string,
  rawValue: unknown
): string => {
  if (rawValue === undefined || rawValue === null || rawValue === '') return ''

  if (isDateLikeColumn(column)) {
    return formatDateTime(rawValue)
  }

  const numericValue = parseNumeric(rawValue)
  if (numericValue !== undefined) {
    if (isCountLikeColumn(column)) {
      return formatInteger(numericValue)
    }
    return formatNumeric(numericValue)
  }

  return String(rawValue)
}

export const getSelectedPointDisplayValue = ({
  column,
  feature,
}: {
  column: string
  feature: GeoJsonFeature
}): string => {
  const properties = feature?.properties || {}

  const formatValueWithUnit = (
    valueKey: string,
    unitKey: string
  ): string => {
    const value = formatSelectedPointCellValue(valueKey, properties[valueKey])
    const unit = properties[unitKey]

    if (!value) return ''
    return typeof unit === 'string' && unit.trim().length > 0
      ? `${value} ${unit}`
      : value
  }

  if (column === 'name') {
    return String(properties.name ?? properties.thing_name ?? '')
  }
  const chemistryDisplayColumn =
    CHEMISTRY_DISPLAY_COLUMNS[column as keyof typeof CHEMISTRY_DISPLAY_COLUMNS]
  if (chemistryDisplayColumn) {
    return formatValueWithUnit(
      chemistryDisplayColumn.valueKey,
      chemistryDisplayColumn.unitKey
    )
  }

  return formatSelectedPointCellValue(column, properties[column])
}

export const formatSelectedPointCoordinates = (coordinates: unknown): string => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return ''

  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return ''

  return `${formatNumeric(longitude)}, ${formatNumeric(latitude)}`
}

export const getSelectedPointColumnLabel = (column: string): string => {
  const chemistryLabel =
    CHEMISTRY_DISPLAY_COLUMNS[column as keyof typeof CHEMISTRY_DISPLAY_COLUMNS]
      ?.label
  const customLabels: Record<string, string> = {
    analyte_count: 'Analytes',
    latest_chemistry_date: 'Latest Date',
    ...(chemistryLabel ? { [column]: chemistryLabel } : {}),
  }

  return (
    customLabels[column] ||
    column
      .replace(/_datetime\b/gi, '_date')
      .replace(/_/g, ' ')
  )
}
