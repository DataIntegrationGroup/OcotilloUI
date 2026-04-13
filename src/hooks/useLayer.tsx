import { useOne } from '@refinedev/core'

export const useLayer = ({
  thing_type,
  label,
  color,
  enabled = true,
}: {
  thing_type: string
  label: string
  color: string
  enabled?: boolean
}) => {
  const { result, query } = useOne({
    dataProviderName: 'ocotillo',
    resource: 'geospatial',
    id: null,
    queryOptions: {
      enabled,
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
    sourceProps: enabled ? { type: 'geojson', data: safeGeoJSON } : null,
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
