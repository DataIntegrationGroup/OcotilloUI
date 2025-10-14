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
  const { data, isLoading } = useOne({
    dataProviderName: 'ocotillo',
    resource: 'geospatial',
    id: null,
    queryOptions: {
      cacheTime: 60000,
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
    data?.data && data.data.type === 'FeatureCollection'
      ? data.data
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
    isLoading,
  }
}
