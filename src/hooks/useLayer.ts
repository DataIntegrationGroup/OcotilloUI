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
    id: undefined,
    queryOptions: {
      cacheTime: 60000, // Cache for 1 minute
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
    meta: {
      requestConfig: {
        params: {
          thing_type: thing_type,
          format: 'geojson',
        },
      },
    },
  })

  return {
    sourceProps: { type: 'geojson', data: data?.data },
    layerProps: {
      label: label,
      type: 'circle' as const,
      paint: {
        'circle-radius': 3,
        'circle-color': color,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
    isLoading: isLoading,
  }
}
