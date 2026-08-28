// ---------------------------------------------------------------------------
// Map symbol colors
//
// Every point, line, and polygon color on the map comes from the viridis ramp
// (see ./viridis). Two kinds of styling use it differently:
//
//  * Classed/continuous layers (TDS, depth to water, water elevation) sample
//    the ramp in order, so darker always means lower and yellow means higher.
//  * Categorical layers (wells, springs, streams, ...) each pin one fixed
//    position on the ramp. Positions are spaced evenly, and the order below
//    interleaves related families — wells next to chemistry next to surface
//    water — so two layers a user is likely to view together land far apart on
//    the ramp and stay easy to tell apart.
//
// Note the inherent limit: a sequential ramp can only carry so many
// categories. With this many layers the gap between adjacent entries is a few
// percent of the ramp, so switching on every layer at once still produces near
// neighbors. In normal use only a handful are visible together.
// ---------------------------------------------------------------------------

import { VIRIDIS_HIGH, VIRIDIS_LOW, viridisColor } from './viridis'

/**
 * Categorical map layers in ramp order: the first entry gets the dark purple
 * end, the last gets yellow, and the rest are spread evenly in between.
 */
const LAYER_RAMP_ORDER = [
  'locations',
  'waterElevationContours',
  'lakesPondsReservoirs',
  'waterWells',
  'waterElevationPoints',
  'latestDepthToWater',
  'waterWellSummary',
  'perennialStreams',
  'springs',
  'activelyMonitored',
  'meteorologicalStations',
  'latestTds',
  'majorChemistry',
  'averageTds',
  'outfallsReturnFlow',
  'ephemeralStreams',
  'rockSampleLocations',
  'minorChemistry',
  'depthToWaterTrend',
  'surfaceWaterDiversions',
  'projectAreas',
  'soilGasSampleLocations',
  'otherThingTypes',
] as const

type MapLayerColorKey = (typeof LAYER_RAMP_ORDER)[number]

/** Viridis hex color for each categorical map layer. */
export const MAP_LAYER_COLORS = Object.fromEntries(
  LAYER_RAMP_ORDER.map((key, index) => [
    key,
    viridisColor(index / (LAYER_RAMP_ORDER.length - 1)),
  ])
) as Record<MapLayerColorKey, string>

/**
 * Fallback for a layer with no color assigned. Sits mid-ramp so it reads as
 * part of the same family rather than as an outlier.
 */
export const MAP_DEFAULT_LAYER_COLOR = viridisColor(0.5)

/**
 * Features in a classed layer whose value is missing or unparseable. Kept
 * deliberately outside the viridis ramp so "no data" never looks like a real
 * class on the legend gradient.
 */
export const MAP_NO_DATA_COLOR = '#9e9e9e'

/** White outline that lifts every symbol off the satellite basemap. */
export const MAP_SYMBOL_STROKE_COLOR = '#ffffff'

/**
 * Translucent white disc drawn behind a highlighted symbol. Neutral on
 * purpose — it has to read as a halo, not as another data class.
 */
export const MAP_HIGHLIGHT_HALO_COLOR = '#ffffff'

/**
 * The selected/active symbol. Yellow fill against the dark end of the ramp
 * gives the strongest contrast available inside the palette, so a highlighted
 * point stands out from both the other points and the imagery underneath.
 */
export const MAP_HIGHLIGHT_COLOR = VIRIDIS_HIGH
export const MAP_HIGHLIGHT_STROKE_COLOR = VIRIDIS_LOW
