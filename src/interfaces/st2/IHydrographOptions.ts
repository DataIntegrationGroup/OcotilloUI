export interface IHydrographOptions {
  useNormalization?: boolean
  useElevation?: boolean
  useCompact?: boolean
  dataZoom?: 'latest' | 'earliest' | 'full'
  showToolbox?: boolean
  invertYAxis?: boolean
  rightPaddingPercent?: number
}
