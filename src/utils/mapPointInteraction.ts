import { getFeatureId } from './mapSelection'

type RenderedPointFeature = {
  id?: string | number
  geometry?: {
    type?: string
    coordinates?: unknown
  }
  layer?: {
    id?: string
  }
  properties?: Record<string, unknown>
}

export const getDistinctMapPoints = (
  features: RenderedPointFeature[]
): RenderedPointFeature[] => {
  const distinctPoints = new Map<string, RenderedPointFeature>()

  for (const feature of features) {
    if (
      !feature.layer?.id?.startsWith('location-') ||
      feature.layer.id.startsWith('location-label-') ||
      feature.geometry?.type !== 'Point'
    ) {
      continue
    }

    const id = getFeatureId(feature)
    if (!id || distinctPoints.has(id)) continue

    distinctPoints.set(id, feature)
  }

  return [...distinctPoints.values()]
}

export const getMapPointBounds = (
  features: RenderedPointFeature[]
): [[number, number], [number, number]] | null => {
  const coordinates = features.flatMap((feature) => {
    const value = feature.geometry?.coordinates
    if (
      !Array.isArray(value) ||
      typeof value[0] !== 'number' ||
      typeof value[1] !== 'number'
    ) {
      return []
    }

    return [[value[0], value[1]] as [number, number]]
  })

  if (coordinates.length === 0) return null

  const longitudes = coordinates.map(([longitude]) => longitude)
  const latitudes = coordinates.map(([, latitude]) => latitude)

  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ]
}
