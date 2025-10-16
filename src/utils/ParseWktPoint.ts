export const parseWktPoint = (
  point: string | null | undefined
): { lon: number; lat: number } | null => {
  if (!point || typeof point !== 'string') return null
  const match = point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
  if (!match) return null
  const [, lon, lat] = match
  return { lon: parseFloat(lon), lat: parseFloat(lat) }
}
