import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { withRetry } from '@/utils/httpRetry'

type LayerLegendScale = {
  gradient: string
  minLabel: string
  maxLabel: string
}

export const useOGCLayer = ({
  collection,
  label,
  providerName = 'ogcapi',
  color = '#9cd0ab',
  colorAccessor,
  textAccessor,
  textColor = '#111111',
  layerType = 'circle',
  paint,
  colorExpression,
  legendColor,
  legendScale,
  colorMappingEnabled = true,
  requestParams,
  enabled = true,
  pageSize = 1000,
  maxPages = 5,
  maxFeatures = 5000,
  requireGeometry = true,
}: {
  collection: string
  label: string
  providerName?: string
  color?: string
  colorAccessor?: (feature: any) => string | undefined
  textAccessor?: (feature: any) => string | undefined
  textColor?: string
  layerType?: 'circle' | 'line' | 'fill'
  paint?: Record<string, any>
  colorExpression?: any
  legendColor?: string
  legendScale?: LayerLegendScale
  colorMappingEnabled?: boolean
  requestParams?: Record<string, string | number | boolean>
  enabled?: boolean
  pageSize?: number
  maxPages?: number
  maxFeatures?: number
  requireGeometry?: boolean
}) => {
  const dataProvider = useDataProvider()

  const requestParamsKey = requestParams ? JSON.stringify(requestParams) : ''

  const { data, isLoading } = useQuery({
    queryKey: [
      'ogcapi-layer',
      providerName,
      collection,
      requestParamsKey,
      pageSize,
      maxPages,
      maxFeatures,
      requireGeometry,
    ],
    gcTime: 60000,
    staleTime: 30000,
    enabled: enabled && collection.length > 0,
    queryFn: async () => {
      const provider = dataProvider(providerName)

      let offset = 0
      let pageCount = 0
      const allFeatures: any[] = []
      let numberMatched: number | undefined

      while (pageCount < maxPages && allFeatures.length < maxFeatures) {
        let result: any

        try {
          result = await withRetry(
            async () =>
              provider.getOne({
                resource: providerName,
                id: null,
                meta: {
                  requestConfig: {
                    params: {
                      collection,
                      f: 'json',
                      limit: pageSize,
                      offset,
                      ...(requestParams || {}),
                    },
                  },
                },
              }),
            {
              retries: 4,
              baseDelayMs: 450,
              maxDelayMs: 6000,
              jitter: true,
              retryOnStatuses: [429, 502, 503, 504],
            }
          )
        } catch {
          // If the upstream provider errors (including persistent 429/400), stop paging and return what we have.
          break
        }

        const featureCollection = result?.data as any

        // Handle error-shaped responses gracefully.
        if (!featureCollection || featureCollection.type !== 'FeatureCollection') {
          break
        }

        const rawFeatures = Array.isArray(featureCollection?.features)
          ? featureCollection.features
          : []

        const features = requireGeometry
          ? rawFeatures.filter(
              (f: any) =>
                Boolean(f?.geometry) &&
                typeof f.geometry?.type === 'string' &&
                Array.isArray(f.geometry?.coordinates)
            )
          : rawFeatures

        const remaining = Math.max(0, maxFeatures - allFeatures.length)
        allFeatures.push(...features.slice(0, remaining))

        if (typeof featureCollection?.numberMatched === 'number') {
          numberMatched = featureCollection.numberMatched
        }

        if (
          allFeatures.length >= maxFeatures ||
          (numberMatched !== undefined && allFeatures.length >= numberMatched) ||
          rawFeatures.length < pageSize
        ) {
          break
        }

        offset += pageSize
        pageCount += 1
      }

      return {
        type: 'FeatureCollection',
        features: allFeatures,
      }
    },
  })

  // Always return valid GeoJSON
  const safeGeoJSONBase =
    data && data.type === 'FeatureCollection'
      ? data
      : { type: 'FeatureCollection', features: [] }

  const safeGeoJSON = {
    ...safeGeoJSONBase,
    features: (safeGeoJSONBase.features || []).map((feature: any) => {
      const resolvedColor = colorAccessor?.(feature)
      const resolvedText = textAccessor?.(feature)
      return {
        ...feature,
        properties: {
          ...(feature?.properties || {}),
          ...(resolvedColor ? { __color: resolvedColor } : {}),
          ...(resolvedText ? { __label: resolvedText } : {}),
        },
      }
    }),
  }

  const hasColorMapping = Boolean(colorAccessor || colorExpression || legendScale)
  const resolvedColor = (colorAccessor
    ? ['coalesce', ['get', '__color'], color]
    : color) as any
  const fallbackColor = legendColor || color
  const effectiveColor =
    hasColorMapping && colorMappingEnabled
      ? colorExpression ?? resolvedColor
      : fallbackColor

  const defaultPaintByType: Record<
    'circle' | 'line' | 'fill',
    Record<string, any>
  > = {
    circle: {
      'circle-radius': 3,
      'circle-color': effectiveColor,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
    line: {
      'line-color': effectiveColor,
      'line-width': 1.5,
      'line-opacity': 0.9,
    },
    fill: {
      'fill-color': effectiveColor,
      'fill-opacity': 0.4,
    },
  }

  return {
    sourceProps: { type: 'geojson', data: safeGeoJSON },
    sourceData: safeGeoJSON,
    legendColor: fallbackColor,
    legendScale: hasColorMapping && colorMappingEnabled ? legendScale : undefined,
    colorMappingAvailable: hasColorMapping,
    colorMappingEnabled: hasColorMapping ? colorMappingEnabled : false,
    layerProps: {
      label,
      type: layerType,
      paint: {
        ...defaultPaintByType[layerType],
        ...(paint || {}),
      },
    },
    textLayerProps: textAccessor
      ? {
          type: 'symbol' as const,
          layout: {
            'text-field': ['get', '__label'],
            'text-size': 19,
            'text-anchor': 'top-left',
            'text-offset': [0.35, 0.35],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': textColor,
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.4,
          },
        }
      : undefined,
    isLoading,
  }
}
