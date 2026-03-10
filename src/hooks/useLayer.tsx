import { useOne } from '@refinedev/core'

export const useLayer = ({
  thing_type,
  label,
  color,
}: {
  thing_type: string
  label: string
  color: string
}) => {
  const { result, query } = useOne({
    dataProviderName: 'ocotillo',
    resource: 'geospatial',
    id: null,
    queryOptions: {
      gcTime: 60000,
      staleTime: 30000,
    },
    meta: {
      requestConfig: {
        params: {
          thing_type,
          format: 'geojson',
        },
      },
    },
  })

  // Always return valid GeoJSON
  const safeGeoJSON =
    result && result.type === 'FeatureCollection'
      ? result
      : { type: 'FeatureCollection', features: [] }

  return {
    sourceProps: { type: 'geojson', data: safeGeoJSON },
    layerProps: {
      label,
      type: 'circle' as const,
      paint: {
        'circle-radius': 3,
        'circle-color': color,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
    isLoading: query.isLoading,
  }
}
