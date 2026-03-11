import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'

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
  requestParams,
  enabled = true,
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
  requestParams?: Record<string, string | number | boolean>
  enabled?: boolean
}) => {
  const dataProvider = useDataProvider()

  const { data, isLoading } = useQuery({
    queryKey: ['ogcapi-layer', providerName, collection, requestParams],
    gcTime: 60000,
    staleTime: 30000,
    enabled: enabled && collection.length > 0,
    queryFn: async () => {
      const provider = dataProvider(providerName)
      const PAGE_SIZE = 1000
      const MAX_PAGES = 1000

      let offset = 0
      let pageCount = 0
      const allFeatures: any[] = []
      let numberMatched: number | undefined

      while (pageCount < MAX_PAGES) {
        const result = await provider.getOne({
          resource: 'ogcapi',
          id: null,
          meta: {
            requestConfig: {
              params: {
                collection,
                f: 'json',
                limit: PAGE_SIZE,
                offset,
                ...(requestParams || {}),
              },
            },
          },
        })

        const featureCollection = result?.data as any
        const features = Array.isArray(featureCollection?.features)
          ? featureCollection.features
          : []

        allFeatures.push(...features)

        if (typeof featureCollection?.numberMatched === 'number') {
          numberMatched = featureCollection.numberMatched
        }

        if (
          (numberMatched !== undefined && allFeatures.length >= numberMatched) ||
          features.length < PAGE_SIZE
        ) {
          break
        }

        offset += PAGE_SIZE
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

  const resolvedColor = (colorAccessor
    ? ['coalesce', ['get', '__color'], color]
    : color) as any
  const effectiveColor = colorExpression ?? resolvedColor

  const defaultPaintByType: Record<'circle' | 'line' | 'fill', Record<string, any>> = {
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
    legendColor: legendColor || color,
    legendScale,
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
