import { parseNumeric } from './parseNumeric'

const normalizeUnitToken = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.toLowerCase().replace(/[^a-z]/g, '')
}

const isMeterUnit = (value: unknown): boolean => {
  const token = normalizeUnitToken(value)
  return (
    token === 'm' ||
    token === 'meter' ||
    token === 'meters' ||
    token === 'metre' ||
    token === 'metres'
  )
}

const isFootUnit = (value: unknown): boolean => {
  const token = normalizeUnitToken(value)
  return (
    token === 'ft' ||
    token === 'foot' ||
    token === 'feet' ||
    token === 'ussurveyfoot' ||
    token === 'ussurveyfeet'
  )
}

const getCanonicalWaterElevationRawValue = (properties: Record<string, any>) =>
  properties.water_elevation_ft

const getCanonicalElevationRawValue = (properties: Record<string, any>) =>
  properties.elevation_ft ?? properties.elevation_m ?? properties.elevation

const getCanonicalDepthToWaterFeet = (properties: Record<string, any>) =>
  parseNumeric(properties.depth_to_water_below_ground_surface_ft) ??
  parseNumeric(properties.depth_to_water_below_ground_surface) ??
  parseNumeric(properties.depth_to_water_bgs) ??
  parseNumeric(properties.depth_to_water)

export const getWaterElevationUnitFromFeature = (
  feature: any
): 'feet' | 'meters' | null => {
  const properties = feature?.properties || {}
  if (properties.water_elevation_ft !== undefined) return 'feet'
  const candidates = [
    properties.water_elevation_unit,
    properties.vertical_unit,
    properties.unit,
    properties.units,
    properties.uom,
  ]

  for (const candidate of candidates) {
    if (isFootUnit(candidate)) return 'feet'
    if (isMeterUnit(candidate)) return 'meters'
  }

  return null
}

const getElevationUnitFromFeature = (feature: any): 'feet' | 'meters' | null => {
  const properties = feature?.properties || {}
  if (properties.elevation_ft !== undefined) return 'feet'
  if (properties.elevation_m !== undefined) return 'meters'
  const candidates = [
    properties.elevation_unit,
    properties.vertical_unit,
    properties.unit,
    properties.units,
    properties.uom,
  ]

  for (const candidate of candidates) {
    if (isFootUnit(candidate)) return 'feet'
    if (isMeterUnit(candidate)) return 'meters'
  }

  return null
}

export const normalizeWaterElevationFeet = (
  rawValue: unknown,
  feature: any
): number | undefined => {
  const parsedValue = parseNumeric(rawValue)
  if (parsedValue === undefined) return undefined

  const unit = getWaterElevationUnitFromFeature(feature)
  return parsedValue
}

export const getWaterElevationFeet = (feature: any): number | undefined => {
  const properties = feature?.properties || {}
  return parseNumeric(properties.water_elevation_ft) ??
    normalizeWaterElevationFeet(getCanonicalWaterElevationRawValue(properties), feature)
}

export const normalizeElevationFeet = (feature: any): number | undefined => {
  const properties = feature?.properties || {}
  const parsedElevation = parseNumeric(getCanonicalElevationRawValue(properties))
  if (parsedElevation === undefined) return undefined

  const explicitUnit = getElevationUnitFromFeature(feature)
  if (explicitUnit === 'meters') return parsedElevation * 3.28084
  if (explicitUnit === 'feet') return parsedElevation

  const waterElevationFeet = getWaterElevationFeet(feature)
  const depthToWaterFeet = getCanonicalDepthToWaterFeet(properties)

  if (
    waterElevationFeet === undefined ||
    depthToWaterFeet === undefined ||
    !Number.isFinite(waterElevationFeet) ||
    !Number.isFinite(depthToWaterFeet)
  ) {
    return undefined
  }

  const expectedElevationFeet = waterElevationFeet + depthToWaterFeet
  const feetDelta = Math.abs(parsedElevation - expectedElevationFeet)
  const meterDelta = Math.abs(
    parsedElevation * 3.28084 - expectedElevationFeet
  )

  if (meterDelta <= 2 && meterDelta < feetDelta) {
    return parsedElevation * 3.28084
  }

  if (feetDelta <= 2) {
    return parsedElevation
  }

  return undefined
}

export const normalizeWaterElevationFeatureCollection = (sourceData: any) => {
  if (!sourceData || !Array.isArray(sourceData.features)) return null

  return {
    ...sourceData,
    features: sourceData.features.map((feature: any) => {
      const properties = feature?.properties || {}
      const waterElevationFeet = normalizeWaterElevationFeet(
        getCanonicalWaterElevationRawValue(properties),
        feature
      )
      const elevationFeet = normalizeElevationFeet({
        ...feature,
        properties: {
          ...properties,
          ...(waterElevationFeet === undefined
            ? {}
            : {
                water_elevation_ft: waterElevationFeet,
                water_elevation_unit: 'ft',
              }),
        },
      })

      if (waterElevationFeet === undefined && elevationFeet === undefined) {
        return feature
      }

      return {
        ...feature,
        properties: {
          ...(feature?.properties || {}),
          ...(waterElevationFeet === undefined
            ? {}
            : {
                water_elevation_ft: waterElevationFeet,
                water_elevation_unit: 'ft',
              }),
          ...(elevationFeet === undefined
            ? {}
            : {
                elevation_ft: elevationFeet,
                elevation: elevationFeet,
                elevation_unit: 'ft',
              }),
        },
      }
    }),
  }
}

export const getWaterElevationStats = (features: any[]) => {
  const values = features
    .map((feature) => getWaterElevationFeet(feature))
    .filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value)
    )
    .sort((a, b) => a - b)

  const minValue = values[0]
  const maxValue = values[values.length - 1]
  const hasValues =
    values.length > 0 &&
    Number.isFinite(minValue) &&
    Number.isFinite(maxValue)
  const hasSpread = hasValues && values.length >= 3 && minValue < maxValue

  const quantileAt = (q: number): number => {
    if (!values.length) return 0
    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.floor((values.length - 1) * q))
    )
    return values[index]
  }

  const breaks = hasSpread
    ? [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((quantile) =>
        Number(quantileAt(quantile).toFixed(2))
      )
    : []

  return { minValue, maxValue, hasValues, hasSpread, breaks }
}
