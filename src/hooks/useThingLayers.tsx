import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { useOGCLayer } from '@/hooks/useOGCLayer'

type OgcCollectionRecord = {
  id?: string
  collection_id?: string
  name?: string
  title?: string
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

const TDS_COLOR_EXPRESSION = [
  'interpolate',
  ['linear'],
  ['to-number', ['coalesce', ['get', 'latest_tds'], ['get', 'tds'], 0]],
  0,
  '#2c7bb6',
  500,
  '#abd9e9',
  1000,
  '#ffffbf',
  2000,
  '#fdae61',
  4000,
  '#d7191c',
]

const DEPTH_TO_WATER_COLOR_EXPRESSION = [
  'interpolate',
  ['linear'],
  [
    'to-number',
    [
      'coalesce',
      ['get', 'latest_depth_to_water'],
      ['get', 'depth_to_water'],
      ['get', 'latest_water_level'],
      0,
    ],
  ],
  0,
  '#1a9641',
  50,
  '#a6d96a',
  150,
  '#fdae61',
  300,
  '#d7191c',
]

const TREND_COLOR_EXPRESSION = [
  'interpolate',
  ['linear'],
  ['to-number', ['coalesce', ['get', 'trend'], ['get', 'latest_trend'], 0]],
  -5,
  '#2166ac',
  0,
  '#f7f7f7',
  5,
  '#b2182b',
]

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
    colorExpression: DEPTH_TO_WATER_COLOR_EXPRESSION,
    legendColor: '#fdae61',
    enabled: latestDepthToWater.exists,
  })
  const averageTdsLayer = useOGCLayer({
    collection: averageTds.id,
    label: averageTds.label,
    color: '#a1887f',
    enabled: averageTds.exists,
  })
  const latestTdsLayer = useOGCLayer({
    collection: latestTds.id,
    label: latestTds.label,
    colorExpression: TDS_COLOR_EXPRESSION,
    legendColor: '#fdae61',
    enabled: latestTds.exists,
  })
  const depthToWaterTrendLayer = useOGCLayer({
    collection: depthToWaterTrend.id,
    label: depthToWaterTrend.label,
    colorExpression: TREND_COLOR_EXPRESSION,
    legendColor: '#b2182b',
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

  return {
    ...(locations.exists ? { 'ogc-locations': locationsLayer } : {}),
    ...(latestDepthToWater.exists
      ? { 'ogc-latest-depth-to-water': latestDepthToWaterLayer }
      : {}),
    ...(averageTds.exists ? { 'ogc-average-tds': averageTdsLayer } : {}),
    ...(latestTds.exists ? { 'ogc-latest-tds': latestTdsLayer } : {}),
    ...(depthToWaterTrend.exists
      ? { 'ogc-depth-to-water-trend': depthToWaterTrendLayer }
      : {}),
    ...(waterWellSummary.exists
      ? { 'ogc-water-well-summary': waterWellSummaryLayer }
      : {}),
    ...(waterWells.exists ? { 'ogc-water-wells': waterWellsLayer } : {}),
    ...(springs.exists ? { 'ogc-springs': springsLayer } : {}),
    ...(surfaceWaterDiversions.exists
      ? { 'ogc-surface-water-diversions': surfaceWaterDiversionsLayer }
      : {}),
    ...(ephemeralStreams.exists
      ? { 'ogc-ephemeral-streams': ephemeralStreamsLayer }
      : {}),
    ...(lakesPondsReservoirs.exists
      ? { 'ogc-lakes-ponds-reservoirs': lakesPondsReservoirsLayer }
      : {}),
    ...(meteorologicalStations.exists
      ? { 'ogc-meteorological-stations': meteorologicalStationsLayer }
      : {}),
    ...(otherThingTypes.exists
      ? { 'ogc-other-thing-types': otherThingTypesLayer }
      : {}),
    ...(outfallsReturnFlow.exists
      ? { 'ogc-outfalls-return-flow': outfallsReturnFlowLayer }
      : {}),
    ...(perennialStreams.exists
      ? { 'ogc-perennial-streams': perennialStreamsLayer }
      : {}),
    ...(rockSampleLocations.exists
      ? { 'ogc-rock-sample-locations': rockSampleLocationsLayer }
      : {}),
    ...(soilGasSampleLocations.exists
      ? { 'ogc-soil-gas-sample-locations': soilGasSampleLocationsLayer }
      : {}),
  }
}
