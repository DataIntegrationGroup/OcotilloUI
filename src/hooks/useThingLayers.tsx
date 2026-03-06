import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { useOGCLayer } from '@/hooks/useOGCLayer'

type OgcCollectionRecord = {
  id?: string
  collection_id?: string
  name?: string
  title?: string
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  if (!normalized) return undefined
  const parsed = Number(normalized[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

const findNumericPropertyWithPriority = (
  feature: any,
  priorityPatterns: RegExp[],
  fallbackPatterns: RegExp[],
  excludePatterns: RegExp[] = []
): number | undefined => {
  const properties = feature?.properties || {}
  const entries = Object.entries(properties) as Array<[string, unknown]>

  const tryMatch = (includePatterns: RegExp[]) => {
    for (const [key, value] of entries) {
      const keyString = String(key)
      if (excludePatterns.some((pattern) => pattern.test(keyString))) continue
      if (!includePatterns.some((pattern) => pattern.test(keyString))) continue
      const parsed = parseNumeric(value)
      if (parsed !== undefined) return parsed
    }
    return undefined
  }

  return tryMatch(priorityPatterns) ?? tryMatch(fallbackPatterns)
}

const findStringProperty = (feature: any, patterns: RegExp[]): string | undefined => {
  const properties = feature?.properties || {}
  for (const [key, value] of Object.entries(properties)) {
    const keyString = String(key)
    if (!patterns.some((pattern) => pattern.test(keyString))) continue
    if (typeof value === 'string' && value.trim().length > 0) return value
  }
  return undefined
}

const tdsColorFromFeature = (feature: any): string | undefined => {
  const value = findNumericPropertyWithPriority(
    feature,
    [
      /(latest|recent|most).*(tds|dissolved.*solids)/i,
      /(tds|dissolved.*solids).*(latest|recent|most)/i,
    ],
    [/tds/i, /dissolved.*solids/i],
    [
      /count/i,
      /num/i,
      /code/i,
      /id$/i,
      /unit/i,
      /rank/i,
      /class/i,
      /flag/i,
      /avg/i,
      /average/i,
      /mean/i,
      /median/i,
      /min/i,
      /max/i,
    ]
  )
  if (value === undefined) return undefined
  if (value < 300) return '#2b83ba'
  if (value < 500) return '#4daf4a'
  if (value < 1000) return '#a6d96a'
  if (value < 2000) return '#fee08b'
  if (value < 5000) return '#f46d43'
  return '#d73027'
}

const averageTdsColorFromFeature = (feature: any): string | undefined => {
  const value = findNumericPropertyWithPriority(
    feature,
    [/(average|avg|mean).*(tds|dissolved.*solids)/i, /(tds|dissolved.*solids).*(average|avg|mean)/i],
    [/tds/i, /dissolved.*solids/i],
    [/count/i, /num/i, /code/i, /id$/i, /unit/i, /rank/i, /class/i, /flag/i, /latest/i]
  )
  if (value === undefined) return undefined
  if (value < 300) return '#2b83ba'
  if (value < 500) return '#4daf4a'
  if (value < 1000) return '#a6d96a'
  if (value < 2000) return '#fee08b'
  if (value < 5000) return '#f46d43'
  return '#d73027'
}

const depthToWaterColorFromFeature = (feature: any): string | undefined => {
  const value = findNumericPropertyWithPriority(
    feature,
    [
      /(latest|recent|most).*(depth.*water|depth_to_water|water_level|depth_to_water_bgs)/i,
      /(depth.*water|depth_to_water|water_level|depth_to_water_bgs).*(latest|recent|most)/i,
    ],
    [/depth.*water/i, /depth_to_water/i, /water_level/i, /depth_to_water_bgs/i],
    [
      /count/i,
      /num/i,
      /code/i,
      /id$/i,
      /unit/i,
      /rank/i,
      /class/i,
      /flag/i,
      /avg/i,
      /average/i,
      /mean/i,
      /median/i,
      /min/i,
      /max/i,
      /trend/i,
      /slope/i,
    ]
  )
  if (value === undefined) return undefined
  if (value < 25) return '#1a9850'
  if (value < 75) return '#66bd63'
  if (value < 150) return '#a6d96a'
  if (value < 250) return '#fee08b'
  if (value < 400) return '#f46d43'
  return '#d73027'
}

const trendColorFromFeature = (feature: any): string | undefined => {
  const label = findStringProperty(feature, [/trend/i, /trend_class/i])?.toLowerCase()
  if (label) {
    if (/(declin|decreas|fall|down)/.test(label)) return '#2c7bb6'
    if (/(stable|flat|no change|neutral)/.test(label)) return '#bdbdbd'
    if (/(ris|increas|up)/.test(label)) return '#d73027'
  }

  const slope = findNumericPropertyWithPriority(
    feature,
    [/trend.*slope/i, /slope.*trend/i, /latest.*trend/i, /trend.*latest/i],
    [/trend/i, /slope/i],
    [/count/i, /num/i, /code/i, /id$/i, /unit/i, /rank/i, /class/i, /flag/i]
  )
  if (slope === undefined) return undefined
  if (slope < -0.2) return '#2c7bb6'
  if (slope > 0.2) return '#d73027'
  return '#bdbdbd'
}

const normalize = (value?: string): string =>
  (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')

const resolveCollection = (
  collections: OgcCollectionRecord[],
  candidates: string[]
) => {
  const normalizedCandidates = candidates.map(normalize)

  const match = collections.find((collection) => {
    const keys = [
      normalize(collection.id),
      normalize(collection.collection_id),
      normalize(collection.name),
      normalize(collection.title),
    ]

    return normalizedCandidates.some((candidate) =>
      keys.some((key) => key === candidate || key.includes(candidate))
    )
  })

  return {
    id: match?.id || match?.collection_id || match?.name || '',
    label:
      match?.title ||
      match?.name ||
      candidates[0].replace(/\s*\(Water Wells\)\s*/g, ''),
    exists: Boolean(match),
  }
}

export const useThingLayers = () => {
  const dataProvider = useDataProvider()

  const { data: collectionsData } = useQuery({
    queryKey: ['ogcapi-collections-all'],
    gcTime: 120000,
    staleTime: 60000,
    queryFn: async () => {
      const provider = dataProvider('ogcapi')
      const result = await provider.getList({
        resource: 'ogcapi',
        pagination: { current: 1, pageSize: 200 },
      })

      return (result?.data ?? []) as OgcCollectionRecord[]
    },
  })

  const collections = collectionsData ?? []

  const locations = resolveCollection(collections, ['Locations', 'locations'])
  const latestDepthToWater = resolveCollection(collections, [
    'Latest Depth to Water (Water Wells)',
    'latest_depth_to_water_water_wells',
    'latest_depth_to_water',
  ])
  const averageTds = resolveCollection(collections, [
    'Average TDS (Water Wells)',
    'average_tds_water_wells',
    'average_tds',
  ])
  const latestTds = resolveCollection(collections, [
    'Latest TDS (Water Wells)',
    'latest_tds_water_wells',
    'latest_tds',
  ])
  const depthToWaterTrend = resolveCollection(collections, [
    'Depth to Water Trend (Water Wells)',
    'depth_to_water_trend_water_wells',
    'depth_to_water_trend',
    'latest_trend',
  ])
  const waterWellSummary = resolveCollection(collections, [
    'Water Well Summary',
    'water_well_summary',
  ])
  const waterWells = resolveCollection(collections, ['Water Wells', 'water_wells'])
  const springs = resolveCollection(collections, ['Springs', 'springs'])
  const surfaceWaterDiversions = resolveCollection(collections, [
    'Surface Water Diversions',
    'surface_water_diversions',
  ])
  const ephemeralStreams = resolveCollection(collections, [
    'Ephemeral Streams',
    'ephemeral_streams',
  ])
  const lakesPondsReservoirs = resolveCollection(collections, [
    'Lakes, Ponds, and Reservoirs',
    'lakes_ponds_and_reservoirs',
  ])
  const meteorologicalStations = resolveCollection(collections, [
    'Meteorological Stations',
    'meteorological_stations',
  ])
  const otherThingTypes = resolveCollection(collections, [
    'Other Thing Types',
    'other_thing_types',
  ])
  const outfallsReturnFlow = resolveCollection(collections, [
    'Outfalls and Return Flow',
    'outfalls_and_return_flow',
  ])
  const perennialStreams = resolveCollection(collections, [
    'Perennial Streams',
    'perennial_streams',
  ])
  const rockSampleLocations = resolveCollection(collections, [
    'Rock Sample Locations',
    'rock_sample_locations',
  ])
  const soilGasSampleLocations = resolveCollection(collections, [
    'Soil Gas Sample Locations',
    'soil_gas_sample_locations',
  ])

  const locationsLayer = useOGCLayer({
    collection: locations.id,
    label: locations.label,
    color: '#607d8b',
    enabled: locations.exists,
  })
  const latestDepthToWaterLayer = useOGCLayer({
    collection: latestDepthToWater.id,
    label: latestDepthToWater.label,
    legendColor: '#fdae61',
    color: '#9e9e9e',
    colorAccessor: depthToWaterColorFromFeature,
    enabled: latestDepthToWater.exists,
  })
  const averageTdsLayer = useOGCLayer({
    collection: averageTds.id,
    label: averageTds.label,
    legendColor: '#f46d43',
    color: '#9e9e9e',
    colorAccessor: averageTdsColorFromFeature,
    enabled: averageTds.exists,
  })
  const latestTdsLayer = useOGCLayer({
    collection: latestTds.id,
    label: latestTds.label,
    legendColor: '#fdae61',
    color: '#9e9e9e',
    colorAccessor: tdsColorFromFeature,
    enabled: latestTds.exists,
  })
  const depthToWaterTrendLayer = useOGCLayer({
    collection: depthToWaterTrend.id,
    label: depthToWaterTrend.label,
    legendColor: '#b2182b',
    color: '#9e9e9e',
    colorAccessor: trendColorFromFeature,
    enabled: depthToWaterTrend.exists,
  })
  const waterWellSummaryLayer = useOGCLayer({
    collection: waterWellSummary.id,
    label: waterWellSummary.label,
    color: '#8bc34a',
    enabled: waterWellSummary.exists,
  })
  const waterWellsLayer = useOGCLayer({
    collection: waterWells.id,
    label: waterWells.label,
    color: '#2b7dc0',
    enabled: waterWells.exists,
  })
  const springsLayer = useOGCLayer({
    collection: springs.id,
    label: springs.label,
    color: '#00acc1',
    enabled: springs.exists,
  })
  const surfaceWaterDiversionsLayer = useOGCLayer({
    collection: surfaceWaterDiversions.id,
    label: surfaceWaterDiversions.label,
    color: '#ef6c00',
    enabled: surfaceWaterDiversions.exists,
  })
  const ephemeralStreamsLayer = useOGCLayer({
    collection: ephemeralStreams.id,
    label: ephemeralStreams.label,
    color: '#8e24aa',
    enabled: ephemeralStreams.exists,
  })
  const lakesPondsReservoirsLayer = useOGCLayer({
    collection: lakesPondsReservoirs.id,
    label: lakesPondsReservoirs.label,
    color: '#3949ab',
    enabled: lakesPondsReservoirs.exists,
  })
  const meteorologicalStationsLayer = useOGCLayer({
    collection: meteorologicalStations.id,
    label: meteorologicalStations.label,
    color: '#546e7a',
    enabled: meteorologicalStations.exists,
  })
  const otherThingTypesLayer = useOGCLayer({
    collection: otherThingTypes.id,
    label: otherThingTypes.label,
    color: '#9e9d24',
    enabled: otherThingTypes.exists,
  })
  const outfallsReturnFlowLayer = useOGCLayer({
    collection: outfallsReturnFlow.id,
    label: outfallsReturnFlow.label,
    color: '#5d4037',
    enabled: outfallsReturnFlow.exists,
  })
  const perennialStreamsLayer = useOGCLayer({
    collection: perennialStreams.id,
    label: perennialStreams.label,
    color: '#1e88e5',
    enabled: perennialStreams.exists,
  })
  const rockSampleLocationsLayer = useOGCLayer({
    collection: rockSampleLocations.id,
    label: rockSampleLocations.label,
    color: '#6d4c41',
    enabled: rockSampleLocations.exists,
  })
  const soilGasSampleLocationsLayer = useOGCLayer({
    collection: soilGasSampleLocations.id,
    label: soilGasSampleLocations.label,
    color: '#7cb342',
    enabled: soilGasSampleLocations.exists,
  })

  const layers: Record<string, any> = {}
  const seenCollectionIds = new Set<string>()

  const addLayer = (
    layerKey: string,
    collection: { id: string; exists: boolean },
    layer: any
  ) => {
    if (!collection.exists || !collection.id) return
    if (seenCollectionIds.has(collection.id)) return
    seenCollectionIds.add(collection.id)
    layers[layerKey] = layer
  }

  addLayer('ogc-locations', locations, locationsLayer)
  addLayer('ogc-latest-depth-to-water', latestDepthToWater, latestDepthToWaterLayer)
  addLayer('ogc-average-tds', averageTds, averageTdsLayer)
  addLayer('ogc-latest-tds', latestTds, latestTdsLayer)
  addLayer('ogc-depth-to-water-trend', depthToWaterTrend, depthToWaterTrendLayer)
  addLayer('ogc-water-well-summary', waterWellSummary, waterWellSummaryLayer)
  addLayer('ogc-water-wells', waterWells, waterWellsLayer)
  addLayer('ogc-springs', springs, springsLayer)
  addLayer(
    'ogc-surface-water-diversions',
    surfaceWaterDiversions,
    surfaceWaterDiversionsLayer
  )
  addLayer('ogc-ephemeral-streams', ephemeralStreams, ephemeralStreamsLayer)
  addLayer(
    'ogc-lakes-ponds-reservoirs',
    lakesPondsReservoirs,
    lakesPondsReservoirsLayer
  )
  addLayer(
    'ogc-meteorological-stations',
    meteorologicalStations,
    meteorologicalStationsLayer
  )
  addLayer('ogc-other-thing-types', otherThingTypes, otherThingTypesLayer)
  addLayer('ogc-outfalls-return-flow', outfallsReturnFlow, outfallsReturnFlowLayer)
  addLayer('ogc-perennial-streams', perennialStreams, perennialStreamsLayer)
  addLayer('ogc-rock-sample-locations', rockSampleLocations, rockSampleLocationsLayer)
  addLayer(
    'ogc-soil-gas-sample-locations',
    soilGasSampleLocations,
    soilGasSampleLocationsLayer
  )

  return layers
}
