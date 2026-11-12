import type { IPdfDensity } from '@/interfaces'

export const scaleForDensity = (
  comfortable: number,
  standard: number,
  compact: number,
  density: IPdfDensity = 'standard'
) =>
  density === 'compact'
    ? compact
    : density === 'comfortable'
      ? comfortable
      : standard
