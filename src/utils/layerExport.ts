import * as turf from '@turf/turf'

const buildCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

const escapeCsvCell = (value: unknown): string => {
  const stringValue = buildCsvValue(value)
  if (/["\n,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export const sanitizeLayerExportFilename = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const filterLayerFeaturesBySelection = (
  features: any[],
  selectionFeatures?: any[] | any
) => {
  const polygonGeometries = (Array.isArray(selectionFeatures)
    ? selectionFeatures
    : selectionFeatures
      ? [selectionFeatures]
      : []
  )
    .map((feature) => feature?.geometry)
    .filter((geometry) =>
      geometry && ['Polygon', 'MultiPolygon'].includes(geometry.type)
    )

  if (polygonGeometries.length === 0) {
    return features
  }

  return features.filter((feature: any) => {
    const geometry = feature?.geometry
    if (!geometry?.type) return false

    try {
      if (geometry.type === 'Point') {
        return polygonGeometries.some((selectionGeometry) =>
          turf.booleanPointInPolygon(
            turf.point(geometry.coordinates),
            selectionGeometry
          )
        )
      }

      if (
        geometry.type === 'MultiPoint' &&
        Array.isArray(geometry.coordinates)
      ) {
        return geometry.coordinates.some((coordinates: number[]) =>
          polygonGeometries.some((selectionGeometry) =>
            turf.booleanPointInPolygon(turf.point(coordinates), selectionGeometry)
          )
        )
      }

      return polygonGeometries.some((selectionGeometry) =>
        turf.booleanIntersects(
          turf.feature(geometry, feature?.properties || {}),
          turf.feature(selectionGeometry)
        )
      )
    } catch {
      return false
    }
  })
}

export const buildLayerCsv = (features: any[]): string => {
  const propertyKeys = [
    ...new Set<string>(
      features.flatMap((feature: any) =>
        (Object.keys(feature?.properties || {}) as string[]).filter(
          (key) => !key.startsWith('__')
        )
      )
    ),
  ].sort()

  const headers: string[] = [
    ...propertyKeys,
    'geometry_type',
    'longitude',
    'latitude',
    'geometry_json',
  ]

  const rows = features.map((feature: any) => {
    const properties = feature?.properties || {}
    const geometry = feature?.geometry || {}
    const coordinates = Array.isArray(geometry.coordinates)
      ? geometry.coordinates
      : []
    const isPoint = geometry.type === 'Point' && coordinates.length >= 2

    const row: Record<string, unknown> = {
      geometry_type: geometry.type || '',
      longitude: isPoint ? coordinates[0] : '',
      latitude: isPoint ? coordinates[1] : '',
      geometry_json: geometry.type ? geometry : '',
    }

    for (const key of propertyKeys) {
      row[key] = properties[key] ?? ''
    }

    return row
  })

  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(',')
    ),
  ].join('\n')
}
