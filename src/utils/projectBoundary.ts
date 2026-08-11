import wellknown from 'wellknown'

/**
 * Project boundaries are stored as a single WKT geometry in `group.project_area`,
 * so uploads must resolve to exactly one polygon. Anything ambiguous is rejected
 * with a message the user can act on rather than being silently merged.
 *
 * The column is MULTIPOLYGON and the API rejects any other WKT type, so the
 * accepted single polygon is emitted as a one-part MultiPolygon.
 */

export type ParsedBoundary = { wkt: string } | { error: string }

const MAX_VERTICES = 50_000

type Ring = number[][]

function isPolygonGeometry(value: unknown): value is GeoJSON.Polygon {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as GeoJSON.Polygon).type === 'Polygon'
  )
}

function isMultiPolygonGeometry(value: unknown): value is GeoJSON.MultiPolygon {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as GeoJSON.MultiPolygon).type === 'MultiPolygon'
  )
}

/** Pulls the one polygon out of a geometry, Feature, or FeatureCollection. */
function extractPolygon(root: unknown): GeoJSON.Polygon | { error: string } {
  if (typeof root !== 'object' || root === null) {
    return { error: 'File does not contain a GeoJSON object.' }
  }

  const node = root as { type?: string; features?: unknown; geometry?: unknown }

  if (node.type === 'FeatureCollection') {
    const features = Array.isArray(node.features) ? node.features : []
    if (features.length === 0) {
      return { error: 'This file has no features.' }
    }
    if (features.length > 1) {
      return {
        error: `This file has ${features.length} features. Upload a file with a single polygon.`,
      }
    }
    return extractPolygon(features[0])
  }

  if (node.type === 'Feature') {
    return extractPolygon(node.geometry)
  }

  if (isPolygonGeometry(node)) {
    return node
  }

  if (isMultiPolygonGeometry(node)) {
    const parts = node.coordinates ?? []
    if (parts.length !== 1) {
      return {
        error: `This file is a MultiPolygon with ${parts.length} parts. Upload a file with a single polygon.`,
      }
    }
    return { type: 'Polygon', coordinates: parts[0] }
  }

  const found = node.type ? `"${node.type}"` : 'an unrecognized type'
  return { error: `Expected a Polygon but found ${found}.` }
}

function validateRings(rings: Ring[]): string | null {
  if (!Array.isArray(rings) || rings.length === 0) {
    return 'Polygon has no coordinates.'
  }

  let vertices = 0

  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4) {
      return 'Each polygon ring needs at least four positions.'
    }

    vertices += ring.length

    for (const position of ring) {
      if (
        !Array.isArray(position) ||
        position.length < 2 ||
        typeof position[0] !== 'number' ||
        typeof position[1] !== 'number' ||
        Number.isNaN(position[0]) ||
        Number.isNaN(position[1])
      ) {
        return 'Coordinates must be numeric [longitude, latitude] pairs.'
      }

      const [longitude, latitude] = position
      if (
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        return 'Coordinates must be WGS84 longitude/latitude (EPSG:4326).'
      }
    }

    const [firstLon, firstLat] = ring[0]
    const [lastLon, lastLat] = ring[ring.length - 1]
    if (firstLon !== lastLon || firstLat !== lastLat) {
      return 'Each polygon ring must be closed (first and last position equal).'
    }
  }

  if (vertices > MAX_VERTICES) {
    return `Polygon has ${vertices.toLocaleString()} vertices, over the ${MAX_VERTICES.toLocaleString()} limit. Simplify it before uploading.`
  }

  return null
}

/** Parses uploaded GeoJSON text into the WKT the API stores, or an error to show. */
export function parseProjectBoundaryGeoJson(text: string): ParsedBoundary {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { error: 'This file is not valid JSON.' }
  }

  const polygon = extractPolygon(parsed)
  if ('error' in polygon) {
    return polygon
  }

  const ringError = validateRings(polygon.coordinates as Ring[])
  if (ringError) {
    return { error: ringError }
  }

  const multiPolygon: GeoJSON.MultiPolygon = {
    type: 'MultiPolygon',
    coordinates: [polygon.coordinates],
  }

  const wkt = wellknown.stringify(
    multiPolygon as Parameters<typeof wellknown.stringify>[0]
  )

  if (!wkt) {
    return { error: 'Could not convert this polygon to WKT.' }
  }

  return { wkt }
}
