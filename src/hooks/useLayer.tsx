import { useOne } from '@refinedev/core'
import { MAP_SYMBOL_STROKE_COLOR } from '@/constants/mapColors'

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
    id: undefined,
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
    // `type` is asserted so it narrows to the "geojson" literal the Source
    // component's discriminated union expects, rather than widening to string.
    sourceProps: enabled ? { type: 'geojson' as const, data: safeGeoJSON } : null,
    layerProps: {
      label,
      type: 'circle' as const,
      paint: {
        'circle-radius': 3,
        'circle-color': color,
        'circle-stroke-color': MAP_SYMBOL_STROKE_COLOR,
        'circle-stroke-width': 1,
      },
    },
    isLoading: query.isLoading,
  }
}
