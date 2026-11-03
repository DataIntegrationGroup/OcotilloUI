import type { IPdfDensity } from '@/interfaces'
import { scaleForDensity } from '../density'

/** Density-aware multiplier: `c`/`st`/`k` are the comfortable / standard / compact base values. */
export type Scale = (
  comfortable: number,
  standard: number,
  compact: number
) => number

/** Build the density-bound `scale(c, st, k)` closure used by every style module. */
export const createScale =
  (density: IPdfDensity = 'standard'): Scale =>
  (comfortable: number, standard: number, compact: number): number =>
    scaleForDensity(comfortable, standard, compact, density)
