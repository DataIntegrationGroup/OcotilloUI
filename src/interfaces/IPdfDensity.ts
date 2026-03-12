export type IPdfDensity = 'comfortable' | 'standard' | 'compact'

export const PDF_DENSITIES: IPdfDensity[] = [
  'compact',
  'standard',
  'comfortable',
] as const
