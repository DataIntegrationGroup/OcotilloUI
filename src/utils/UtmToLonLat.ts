import proj4 from 'proj4'

export type Datum = 'WGS84' | 'NAD83'

export const convertUTMToLonLat = (
  x: number,
  y: number,
  zone?: number,
  datum?: string
): [number, number] => {
  let finalZone = zone
  const finalDatum = datum || 'WGS84'

  if (!zone || isNaN(zone)) {
    console.warn(
      'UTM zone is missing or invalid — defaulting to zone 13 (Western US)'
    )
    finalZone = 13
  }

  let utmProj: string
  if (finalDatum === 'NAD83') {
    utmProj = `+proj=utm +zone=${finalZone} +datum=NAD83 +units=m +no_defs`
  } else {
    utmProj = `+proj=utm +zone=${finalZone} +datum=WGS84 +units=m +no_defs`
  }

  return proj4(utmProj, 'EPSG:4326', [x, y])
}

export const convertLonLatToUTM = (
  {
    lat,
    lon,
  }: {
    lat: number
    lon: number
  },
  zone?: number,
  datum: Datum = 'WGS84'
): {
  easting: number
  northing: number
  zone: number
  datum: Datum
} => {
  const finalZone = zone && !isNaN(zone) ? zone : getUTMZoneFromLongitude(lon)
  const utmProj =
    datum === 'NAD83'
      ? `+proj=utm +zone=${finalZone} +datum=NAD83 +units=m +no_defs`
      : `+proj=utm +zone=${finalZone} +datum=WGS84 +units=m +no_defs`

  const [easting, northing] = proj4('EPSG:4326', utmProj, [lon, lat])

  return {
    easting,
    northing,
    zone: finalZone,
    datum,
  }
}

const getUTMZoneFromLongitude = (lon: number): number => {
  return Math.floor((lon + 180) / 6) + 1
}
