import { ILocation } from '@/interfaces/ocotillo/ILocation'

export const parseWktPoint = (
  location: Pick<ILocation, 'point'>
): { lon: number; lat: number } | null => {
  if (!location || typeof location.point !== 'string') return null
  const match = location.point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
  if (!match) return null
  const [, lon, lat] = match
  return { lon: parseFloat(lon), lat: parseFloat(lat) }
}
