type GeoJsonFeature = any

const EXCLUDED_SELECTED_POINT_COLUMNS = new Set([
  'thing_type',
  'thing_id',
  'well_id',
  'id',
  'observation_id',
  'major_chemistry_id',
  '__water_elevation',
])

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  if (!normalized) return undefined
  const parsed = Number(normalized[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

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
      .filter(Boolean) as string[]
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

export const getSelectedLayerValue = (
  feature: GeoJsonFeature,
  selectedLayerKey?: string | null
): string => {
  const properties = feature?.properties || {}

  if (!selectedLayerKey) return ''

  if (selectedLayerKey === 'ogc-water-elevation-points') {
    const value = parseNumeric(properties.__water_elevation ?? properties.value)
    return value === undefined ? '' : formatNumeric(value)
  }

  const numericCandidatesByLayer: Record<string, string[]> = {
    'ogc-latest-depth-to-water': [
      'latest_depth_to_water',
      'depth_to_water_bgs',
      'depth_to_water',
      'water_level',
    ],
    'ogc-average-tds': ['average_tds', 'avg_tds', 'tds'],
    'ogc-latest-tds': ['latest_tds', 'tds'],
    'ogc-depth-to-water-trend': [
      'trend_class',
      'trend_slope',
      'slope',
    ],
  }

  const candidates = numericCandidatesByLayer[selectedLayerKey] ?? ['value']
  for (const key of candidates) {
    const rawValue = properties[key]
    if (rawValue === undefined || rawValue === null || rawValue === '') continue

    const numericValue = parseNumeric(rawValue)
    if (numericValue !== undefined) return formatNumeric(numericValue)
    return String(rawValue)
  }

  if (properties.value !== undefined && properties.value !== null) {
    const numericValue = parseNumeric(properties.value)
    return numericValue === undefined
      ? String(properties.value)
      : formatNumeric(numericValue)
  }

  return ''
}

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

  if (column === 'name') {
    return String(properties.name ?? properties.thing_name ?? '')
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

export const getSelectedPointColumnLabel = (column: string): string =>
  column
    .replace(/_datetime\b/gi, '_date')
    .replace(/_/g, ' ')
