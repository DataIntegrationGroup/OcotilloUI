import type {
  Map as MapLibreMap,
  MapGeoJSONFeature,
  PointLike,
  QueryRenderedFeaturesOptions,
} from 'maplibre-gl'

export const queryRenderedFeaturesSafely = (
  map: MapLibreMap | null | undefined,
  geometry?: PointLike,
  options?: QueryRenderedFeaturesOptions
): MapGeoJSONFeature[] => {
  if (!map || !map.loaded()) return []

  try {
    return map.queryRenderedFeatures(geometry, options)
  } catch {
    return []
  }
}
