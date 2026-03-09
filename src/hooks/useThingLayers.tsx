import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import * as turf from '@turf/turf'
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

const WATER_ELEVATION_LEGEND = {
  gradient:
    'linear-gradient(90deg, #2c7bb6 0%, #00a6ca 20%, #00ccbc 40%, #90eb9d 55%, #ffff8c 70%, #f9d057 82%, #f29e2e 92%, #d7191c 100%)',
  minLabel: 'Lower (ft)',
  maxLabel: 'Higher (ft)',
}

const METERS_TO_FEET = 3.28084
const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
} as const

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
  const collectionSearchText = (collection: OgcCollectionRecord): string =>
    [
      collection.id,
      collection.collection_id,
      collection.name,
      collection.title,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

  const resolveCollectionByTokenScore = ({
    includeAny,
    includeOneOf,
    includeAll,
    exclude = [],
    fallbackLabel,
    minScore = 3,
  }: {
    includeAny: RegExp[]
    includeOneOf: RegExp[]
    includeAll: RegExp[]
    exclude?: RegExp[]
    fallbackLabel: string
    minScore?: number
  }) => {
    let bestMatch: OgcCollectionRecord | undefined
    let bestScore = -1

    for (const collection of collections) {
      const text = collectionSearchText(collection)
      if (exclude.some((pattern) => pattern.test(text))) continue
      if (!includeOneOf.some((pattern) => pattern.test(text))) continue
      if (!includeAll.every((pattern) => pattern.test(text))) continue

      let score = 0
      for (const pattern of includeAny) {
        if (pattern.test(text)) score += 1
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = collection
      }
    }

    const exists = Boolean(bestMatch) && bestScore >= minScore

    return {
      id: bestMatch?.id || bestMatch?.collection_id || bestMatch?.name || '',
      label: bestMatch?.title || bestMatch?.name || fallbackLabel,
      exists,
    }
  }

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
  const waterElevationContoursPrimary = resolveCollection(collections, [
    'Water Elevation Contours',
    'water_elevation_contours',
    'water_elevation_contour',
    'groundwater_elevation_contours',
    'water_level_contours',
    'water_table_contours',
    'potentiometric_surface_contours',
    'piezometric_contours',
  ])
  const waterElevationContours = waterElevationContoursPrimary.exists
    ? waterElevationContoursPrimary
    : resolveCollectionByTokenScore({
        includeAny: [
          /water/i,
          /groundwater/i,
          /elevation/i,
          /level/i,
          /table/i,
          /potentiometric/i,
          /piezometric/i,
          /head/i,
          /surface/i,
          /contour/i,
          /isoline/i,
        ],
        includeOneOf: [/contour|isoline/i],
        includeAll: [/potentiometric|piezometric|elevation|water[\s_-]?table|head/i],
        exclude: [/depth[\s_-]?to[\s_-]?water/i, /trend/i, /tds/i],
        fallbackLabel: 'Water Elevation Contours',
      })
  const waterElevationPointsPrimary = resolveCollection(collections, [
    'Water Elevation Points',
    'water_elevation_points',
    'water_elevation_point',
    'water_elevation_wells',
    'ogcapi/collections/water_elevation_wells/items',
    'groundwater_elevation_points',
    'water_level_points',
    'water_table_points',
    'potentiometric_surface_points',
    'piezometric_points',
  ])
  const waterElevationPoints = waterElevationPointsPrimary.exists
    ? waterElevationPointsPrimary
    : resolveCollectionByTokenScore({
        includeAny: [
          /water/i,
          /groundwater/i,
          /elevation/i,
          /level/i,
          /table/i,
          /potentiometric/i,
          /piezometric/i,
          /head/i,
          /surface/i,
          /point/i,
          /points/i,
          /station/i,
          /well/i,
        ],
        includeOneOf: [/point|points|station|well/i],
        includeAll: [/potentiometric|piezometric|elevation|water[\s_-]?table|head/i],
        exclude: [/depth[\s_-]?to[\s_-]?water/i, /trend/i, /tds/i],
        fallbackLabel: 'Water Elevation Points',
      })
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
  const waterElevationContoursLayer = useOGCLayer({
    collection: waterElevationContours.id,
    label: waterElevationContours.label,
    color: '#0d47a1',
    layerType: 'line',
    paint: {
      'line-width': 1.2,
      'line-opacity': 0.85,
    },
    enabled: waterElevationContours.exists,
  })
  function parseNumeric(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value !== 'string') return undefined
    const match = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
    if (!match) return undefined
    const parsed = Number(match[0])
    return Number.isFinite(parsed) ? parsed : undefined
  }

  function waterElevationValueFromFeature(feature: any): number | undefined {
    const properties = feature?.properties || {}
    const meters = parseNumeric(properties.water_elevation)
    return meters === undefined ? undefined : meters * METERS_TO_FEET
  }

  const waterElevationPointsLayer = useOGCLayer({
    collection: waterElevationPoints.id,
    label: `${waterElevationPoints.label} (ft)`,
    color: '#1976d2',
    legendScale: WATER_ELEVATION_LEGEND,
    enabled: waterElevationPoints.exists,
  })

  const waterElevationPointFeatures = useMemo(() => {
    return Array.isArray((waterElevationPointsLayer.sourceData as any)?.features)
      ? (((waterElevationPointsLayer.sourceData as any).features as any[]) ?? [])
      : []
  }, [waterElevationPointsLayer.sourceData])

  const waterElevationPointFeaturesSignature = useMemo(() => {
    const size = waterElevationPointFeatures.length
    if (size === 0) return '0'

    const stride = Math.max(1, Math.floor(size / 24))
    const parts: string[] = [String(size)]

    for (let index = 0; index < size; index += stride) {
      const feature = waterElevationPointFeatures[index]
      const coords = feature?.geometry?.coordinates
      const x = Array.isArray(coords) ? Number(coords[0]) : NaN
      const y = Array.isArray(coords) ? Number(coords[1]) : NaN
      const z = waterElevationValueFromFeature(feature)
      parts.push(
        `${Number.isFinite(x) ? x.toFixed(4) : 'x'}:${Number.isFinite(y) ? y.toFixed(4) : 'y'}:${typeof z === 'number' ? z.toFixed(2) : 'z'}`
      )
    }

    return parts.join('|')
  }, [waterElevationPointFeatures])

  const waterElevationStats = useMemo(() => {
    const values = waterElevationPointFeatures
      .map((feature) => waterElevationValueFromFeature(feature))
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    const sortedValues = [...values].sort((a, b) => a - b)
    const minValue = sortedValues[0]
    const maxValue = sortedValues[sortedValues.length - 1]
    const hasSpread =
      sortedValues.length >= 3 &&
      Number.isFinite(minValue) &&
      Number.isFinite(maxValue) &&
      minValue < maxValue

    const quantileAt = (q: number): number => {
      if (!sortedValues.length) return 0
      const index = Math.min(
        sortedValues.length - 1,
        Math.max(0, Math.floor((sortedValues.length - 1) * q))
      )
      return sortedValues[index]
    }

    const breaks = hasSpread
      ? [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((quantile) =>
          Number(quantileAt(quantile).toFixed(2))
        )
      : []

    return { minValue, maxValue, hasSpread, breaks }
  }, [waterElevationPointFeatures])

  const waterElevationColors = [
    '#2c7bb6',
    '#00a6ca',
    '#00ccbc',
    '#90eb9d',
    '#ffff8c',
    '#f29e2e',
    '#d7191c',
  ]

  const buildWaterElevationStepExpression = (propertyName: string): any =>
    waterElevationStats.hasSpread
      ? [
          'step',
          ['coalesce', ['get', propertyName], -999999],
          waterElevationColors[0],
          waterElevationStats.breaks[0],
          waterElevationColors[1],
          waterElevationStats.breaks[1],
          waterElevationColors[2],
          waterElevationStats.breaks[2],
          waterElevationColors[3],
          waterElevationStats.breaks[3],
          waterElevationColors[4],
          waterElevationStats.breaks[4],
          waterElevationColors[5],
          waterElevationStats.breaks[5],
          waterElevationColors[6],
        ]
      : '#1976d2'

  const waterElevationColorExpression: any =
    buildWaterElevationStepExpression('__water_elevation')
  const waterElevationContourColorExpression = useMemo(
    () => buildWaterElevationStepExpression('__water_elevation'),
    [waterElevationStats.hasSpread, waterElevationStats.breaks]
  )

  const waterElevationLegendScale = waterElevationStats.hasSpread
    ? {
        ...WATER_ELEVATION_LEGEND,
        minLabel: `${Math.round(waterElevationStats.minValue)}`,
        maxLabel: `${Math.round(waterElevationStats.maxValue)} ft`,
      }
    : WATER_ELEVATION_LEGEND

  const waterElevationPointsLayerStyled = useMemo(() => {
    const sourceData = waterElevationPointsLayer.sourceData as any
    if (!sourceData || !Array.isArray(sourceData.features)) return waterElevationPointsLayer

    const dataWithDerivedElevation = {
      ...sourceData,
      features: sourceData.features.map((feature: any) => ({
        ...feature,
        properties: {
          ...(feature?.properties || {}),
          __water_elevation: waterElevationValueFromFeature(feature),
        },
      })),
    }

    return {
      ...waterElevationPointsLayer,
      sourceProps: {
        ...waterElevationPointsLayer.sourceProps,
        data: dataWithDerivedElevation,
      },
      legendScale: waterElevationLegendScale,
      layerProps: {
        ...waterElevationPointsLayer.layerProps,
        paint: {
          ...(waterElevationPointsLayer.layerProps?.paint || {}),
          'circle-color': waterElevationColorExpression,
        },
      },
    }
  }, [
    waterElevationPointsLayer,
    waterElevationColorExpression,
    waterElevationLegendScale,
  ])

  const waterElevationDerivedContourLayerData = useQuery({
    queryKey: [
      'ogc-water-elevation-derived-contours',
      waterElevationPoints.id,
      waterElevationPointFeaturesSignature,
    ],
    enabled:
      !waterElevationContours.exists &&
      waterElevationPointFeatures.length >= 12 &&
      waterElevationStats.hasSpread,
    staleTime: 300000,
    gcTime: 600000,
    queryFn: async () => {
      const pointFeatures = waterElevationPointFeatures
        .map((feature) => {
          const elevation = waterElevationValueFromFeature(feature)
          const geometry = feature?.geometry
          if (
            elevation === undefined ||
            geometry?.type !== 'Point' ||
            !Array.isArray(geometry.coordinates) ||
            geometry.coordinates.length < 2
          ) {
            return null
          }

          const [x, y] = geometry.coordinates
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null

          return turf.point([x, y], { value: elevation })
        })
        .filter(Boolean) as any[]

      if (pointFeatures.length < 12) return EMPTY_FEATURE_COLLECTION

      // Keep contour generation bounded so layer toggles stay responsive.
      const maxSamples = 1200
      const sampledPoints =
        pointFeatures.length > maxSamples
          ? pointFeatures.filter(
              (_, index) => index % Math.ceil(pointFeatures.length / maxSamples) === 0
            )
          : pointFeatures

      const sampleCollection = turf.featureCollection(sampledPoints)
      const [minX, minY, maxX, maxY] = turf.bbox(sampleCollection)
      if (
        !Number.isFinite(minX) ||
        !Number.isFinite(minY) ||
        !Number.isFinite(maxX) ||
        !Number.isFinite(maxY) ||
        minX >= maxX ||
        minY >= maxY
      ) {
        return EMPTY_FEATURE_COLLECTION
      }

      const minPoint = turf.point([minX, minY])
      const maxPoint = turf.point([maxX, maxY])
      const diagonalKm = turf.distance(minPoint, maxPoint, { units: 'kilometers' })
      const cellSizeKm = Math.max(0.8, Math.min(4, diagonalKm / 70))

      const minValue = waterElevationStats.minValue
      const maxValue = waterElevationStats.maxValue
      const breaks: number[] = []
      const steps = 24
      const interval = (maxValue - minValue) / (steps + 1)
      for (let i = 1; i <= steps; i += 1) {
        breaks.push(Number((minValue + interval * i).toFixed(2)))
      }

      if (!breaks.length) return EMPTY_FEATURE_COLLECTION

      const interpolation = (turf as any).interpolate(sampleCollection, cellSizeKm, {
        gridType: 'point',
        property: 'value',
        units: 'kilometers',
        weight: 2,
      })
      const contours = (turf as any).isolines(interpolation, breaks, {
        zProperty: 'value',
      })

      const contourFeatures = Array.isArray(contours?.features) ? contours.features : []
      const smoothLineCoords = (coordinates: number[][]): number[][] => {
        if (coordinates.length < 3) return coordinates
        try {
          const smoothed = (turf as any).bezierSpline(turf.lineString(coordinates), {
            resolution: 8000,
            sharpness: 0.7,
          })
          const smoothedCoords = smoothed?.geometry?.coordinates
          return Array.isArray(smoothedCoords) && smoothedCoords.length >= 2
            ? smoothedCoords
            : coordinates
        } catch {
          return coordinates
        }
      }

      const smoothedContourFeatures = contourFeatures.map((feature: any) => {
        const geometry = feature?.geometry || {}
        const contourElevation = parseNumeric(feature?.properties?.value)
        const withContourElevation = {
          ...(feature?.properties || {}),
          ...(contourElevation === undefined
            ? {}
            : { __water_elevation: contourElevation }),
        }

        if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
          return {
            ...feature,
            geometry: {
              ...geometry,
              coordinates: smoothLineCoords(geometry.coordinates),
            },
            properties: withContourElevation,
          }
        }

        if (geometry.type === 'MultiLineString' && Array.isArray(geometry.coordinates)) {
          return {
            ...feature,
            geometry: {
              ...geometry,
              coordinates: geometry.coordinates.map((lineCoords: number[][]) =>
                smoothLineCoords(lineCoords)
              ),
            },
            properties: withContourElevation,
          }
        }

        return {
          ...feature,
          properties: withContourElevation,
        }
      })

      return {
        type: 'FeatureCollection',
        features: smoothedContourFeatures,
      }
    },
  })

  const waterElevationDerivedContoursLayer = useMemo(
    () => ({
      sourceProps: {
        type: 'geojson',
        data: (waterElevationDerivedContourLayerData.data ?? EMPTY_FEATURE_COLLECTION) as any,
      },
      sourceData: (waterElevationDerivedContourLayerData.data ??
        EMPTY_FEATURE_COLLECTION) as any,
      legendScale: waterElevationLegendScale,
      legendColor: '#0d47a1',
      layerProps: {
        label: `${waterElevationPoints.label} Contours (derived)`,
        type: 'line' as const,
        paint: {
          'line-color': waterElevationContourColorExpression,
          'line-width': 1.2,
          'line-opacity': 0.85,
        },
      },
      textLayerProps: {
        type: 'symbol' as const,
        layout: {
          'symbol-placement': 'line' as const,
          'text-field': [
            'case',
            ['has', '__water_elevation'],
            ['concat', ['to-string', ['round', ['get', '__water_elevation']]], ' ft'],
            '',
          ],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 12, 12],
          'text-letter-spacing': 0.02,
          'text-allow-overlap': false,
          'symbol-spacing': 260,
        },
        paint: {
          'text-color': '#1c1c1c',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.2,
          'text-opacity': 0.92,
        },
      },
      isLoading: waterElevationDerivedContourLayerData.isLoading,
    }),
    [
      waterElevationDerivedContourLayerData.data,
      waterElevationDerivedContourLayerData.isLoading,
      waterElevationLegendScale,
      waterElevationContourColorExpression,
      waterElevationPoints.label,
    ]
  )

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
    if (!hasId) return
    if (seenCollectionIds.has(collection.id)) return
    seenCollectionIds.add(collection.id)
    layers[layerKey] = layer
  }

  addLayer('ogc-locations', locations, locationsLayer)
  addLayer('ogc-latest-depth-to-water', latestDepthToWater, latestDepthToWaterLayer)
  addLayer('ogc-average-tds', averageTds, averageTdsLayer)
  addLayer('ogc-latest-tds', latestTds, latestTdsLayer)
  addLayer('ogc-depth-to-water-trend', depthToWaterTrend, depthToWaterTrendLayer)
  addLayer(
    'ogc-water-elevation-points',
    waterElevationPoints,
    waterElevationPointsLayerStyled
  )
  addLayer(
    'ogc-water-elevation-contours',
    waterElevationContours,
    waterElevationContoursLayer
  )
  if (!waterElevationContours.exists) {
    layers['ogc-water-elevation-contours-derived'] = waterElevationDerivedContoursLayer
  }
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
