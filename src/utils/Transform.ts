import type { IHydrographOptions } from '@/interfaces/st2'

export interface TransformParams {
  // Raw observation value
  value: number
  // Reference or baseline value
  reference?: number
  // Optional offset applied
  offset?: number
  // Configuration flags controlling how values are rendered
  options?: IHydrographOptions
}

/**
 * Applies data transformations for the hydrograph.
 *
 * Returns a numeric result suitable for plotting on a chart.
 *
 */
export const transform = ({
  value,
  reference = 0,
  offset = 0,
  options,
}: TransformParams): number => {
  if (!options) return value

  if (options.useNormalization) {
    return value - reference
  }

  if (options.useElevation) {
    return reference - value
  }

  if (options.useCompact) {
    return value - reference + offset
  }

  return value
}
