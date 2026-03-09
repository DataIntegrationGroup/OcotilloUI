import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { useOGCLayer } from '@/hooks/useOGCLayer'
import {
  OgcCollectionRecord,
  resolveCollection,
  DEPTH_LEGEND,
  TDS_LEGEND,
  TREND_LEGEND,
  latestDepthToWaterColorFromFeature,
  averageTdsColorFromFeature,
  latestTdsColorFromFeature,
  trendColorFromFeature,
} from '@/utils/ogcLayerUtils'

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
    colorAccessor: latestDepthToWaterColorFromFeature,
    legendScale: DEPTH_LEGEND,
    enabled: latestDepthToWater.exists,
  })
  const averageTdsLayer = useOGCLayer({
    collection: averageTds.id,
    label: averageTds.label,
    legendColor: '#f46d43',
    color: '#9e9e9e',
    colorAccessor: averageTdsColorFromFeature,
    legendScale: TDS_LEGEND,
    enabled: averageTds.exists,
  })
  const latestTdsLayer = useOGCLayer({
    collection: latestTds.id,
    label: latestTds.label,
    legendColor: '#fdae61',
    color: '#9e9e9e',
    colorAccessor: latestTdsColorFromFeature,
    legendScale: TDS_LEGEND,
    enabled: latestTds.exists,
  })
  const depthToWaterTrendLayer = useOGCLayer({
    collection: depthToWaterTrend.id,
    label: depthToWaterTrend.label,
    legendColor: '#b2182b',
    color: '#9e9e9e',
    colorAccessor: trendColorFromFeature,
    legendScale: TREND_LEGEND,
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
    const hasId = collection.exists && collection.id
    if (hasId && seenCollectionIds.has(collection.id)) return
    if (hasId) seenCollectionIds.add(collection.id)
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
