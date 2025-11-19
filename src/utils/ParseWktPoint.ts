import { ILocation } from '@/interfaces/ocotillo/ILocation'

export const parseWktPoint = (
  location: Pick<ILocation, 'point'>
): { lon: number | null; lat: number | null } => {
  if (!location || typeof location.point !== 'string')
    return { lon: null, lat: null }
  const match = location.point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
  if (!match) return { lon: null, lat: null }
  const [, lon, lat] = match
  return { lon: parseFloat(lon), lat: parseFloat(lat) }
}
