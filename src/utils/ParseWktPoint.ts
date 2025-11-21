export const parseWktPoint = (
  point?: string
): { lon: number | null; lat: number | null } => {
  if (!point || typeof point !== 'string') return { lon: null, lat: null }
  const match = point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
  if (!match) return { lon: null, lat: null }
  const [, lon, lat] = match
  return { lon: parseFloat(lon), lat: parseFloat(lat) }
}
