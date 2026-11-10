import type { IPdfDensity } from '@/interfaces'

export const scaleForDensity = (
  comfortable: number,
  _standard?: number,
  _compact?: number,
  _density: IPdfDensity = 'comfortable'
): number => comfortable
