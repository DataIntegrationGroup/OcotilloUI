import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'

export const useOGCLayer = ({
  collection,
  label,
  color = '#9cd0ab',
  colorExpression,
  legendColor,
  enabled = true,
}: {
  collection: string
  label: string
  color?: string
  colorExpression?: any[]
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
  const safeGeoJSON =
    data && data.type === 'FeatureCollection'
      ? data
      : { type: 'FeatureCollection', features: [] }

  return {
    sourceProps: { type: 'geojson', data: safeGeoJSON },
    legendColor: legendColor || color,
    layerProps: {
      label,
      type: 'circle' as const,
      paint: {
        'circle-radius': 3,
        'circle-color': (colorExpression || color) as any,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
    isLoading,
  }
}
