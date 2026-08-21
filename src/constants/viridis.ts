// ---------------------------------------------------------------------------
// Viridis color palette
//
// Viridis is a perceptually uniform, colorblind-friendly colormap: equal steps
// in the data produce equal-looking steps in color, and the ramp reads the same
// under the common forms of color vision deficiency. It also stays legible on
// satellite imagery because it runs dark-purple -> teal -> green -> yellow,
// none of which collide with the browns and grays of aerial photography.
//
// Everything here is derived from ten evenly spaced anchors taken from the
// reference implementation (viridisLite::viridis(10)). Colors between anchors
// are linearly interpolated, which tracks the full 256-entry reference map
// closely enough to be visually indistinguishable at map-symbol sizes.
//
// Reference: https://sjmgarnier.github.io/viridisLite/reference/viridis.html
// ---------------------------------------------------------------------------

/** Evenly spaced samples of the reference viridis ramp, dark end first. */
export const VIRIDIS_ANCHORS = [
  '#440154',
  '#482878',
  '#3e4a89',
  '#31688e',
  '#26828e',
  '#1f9e89',
  '#35b779',
  '#6dcd59',
  '#b4de2c',
  '#fde725',
] as const

const clamp01 = (value: number): number => {
  // Treat non-finite values (NaN/±Infinity) as 0 so callers don't have to guard.
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

const hexToRgb = (hex: string): [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]

const channelToHex = (value: number): string =>
  Math.round(value).toString(16).padStart(2, '0')

/**
 * Color at `position` along the viridis ramp, where 0 is the dark purple end
 * and 1 is the bright yellow end. Values outside 0..1 are clamped, and
 * non-finite values (NaN/±Infinity) are treated as 0 so callers never have to
 * sanitize computed ratios.
 */
export const viridisColor = (position: number): string => {
  const scaled = clamp01(position) * (VIRIDIS_ANCHORS.length - 1)
  const lowerIndex = Math.floor(scaled)
  const upperIndex = Math.min(VIRIDIS_ANCHORS.length - 1, lowerIndex + 1)
  const fraction = scaled - lowerIndex

  const [r1, g1, b1] = hexToRgb(VIRIDIS_ANCHORS[lowerIndex])
  const [r2, g2, b2] = hexToRgb(VIRIDIS_ANCHORS[upperIndex])

  const r = r1 + (r2 - r1) * fraction
  const g = g1 + (g2 - g1) * fraction
  const b = b1 + (b2 - b1) * fraction

  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`
}

/**
 * `count` colors spread evenly across the ramp, including both endpoints.
 * Use this for binned/classed styling — e.g. six TDS classes get
 * `viridisSamples(6)`, dark for the lowest class through yellow for the highest.
 */
export const viridisSamples = (count: number): string[] => {
  if (count <= 0) return []
  if (count === 1) return [viridisColor(0.5)]
  return Array.from({ length: count }, (_, index) =>
    viridisColor(index / (count - 1))
  )
}

/**
 * A CSS `linear-gradient` across the ramp, for legend swatches. More stops
 * means a smoother gradient; ten matches the anchor resolution.
 */
export const viridisGradient = (stopCount = 10, angle = '90deg'): string => {
  const samples = viridisSamples(Math.max(2, stopCount))
  const stops = samples.map(
    (color, index) =>
      `${color} ${Math.round((index / (samples.length - 1)) * 100)}%`
  )
  return `linear-gradient(${angle}, ${stops.join(', ')})`
}

/** Dark purple end of the ramp — lowest values. */
export const VIRIDIS_LOW = VIRIDIS_ANCHORS[0]

/** Teal middle of the ramp — mid values, and the neutral in diverging scales. */
export const VIRIDIS_MID = viridisColor(0.5)

/** Bright yellow end of the ramp — highest values. */
export const VIRIDIS_HIGH = VIRIDIS_ANCHORS[VIRIDIS_ANCHORS.length - 1]
