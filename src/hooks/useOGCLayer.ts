import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'

export const useOGCLayer = ({
  collection,
  label,
  color = '#9cd0ab',
  colorAccessor,
  legendColor,
  enabled = true,
}: {
  collection: string
  label: string
  color?: string
  colorAccessor?: (feature: any) => string | undefined
  legendColor?: string
  enabled?: boolean
}) => {
  const dataProvider = useDataProvider()

  const { data, isLoading } = useQuery({
    queryKey: ['ogcapi-layer', collection],
    gcTime: 60000,
    staleTime: 30000,
    enabled: enabled && collection.length > 0,
    queryFn: async () => {
      const provider = dataProvider('ogcapi')
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
                format: 'geojson',
                limit: PAGE_SIZE,
                offset,
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

  const safeGeoJSON = colorAccessor
    ? {
        ...safeGeoJSONBase,
        features: (safeGeoJSONBase.features || []).map((feature: any) => {
          const resolvedColor = colorAccessor(feature)
          return {
            ...feature,
            properties: {
              ...(feature?.properties || {}),
              ...(resolvedColor ? { __color: resolvedColor } : {}),
            },
          }
        }),
      }
    : safeGeoJSONBase

  const circleColor = (colorAccessor
    ? ['coalesce', ['get', '__color'], color]
    : color) as any

  return {
    sourceProps: { type: 'geojson', data: safeGeoJSON },
    legendColor: legendColor || color,
    layerProps: {
      label,
      type: 'circle' as const,
      paint: {
        'circle-radius': 3,
        'circle-color': circleColor,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
    isLoading,
  }
}
