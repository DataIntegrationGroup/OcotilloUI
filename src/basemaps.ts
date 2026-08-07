import type { StyleSpecification } from 'maplibre-gl'

/**
 * Basemap catalog for MapLibre.
 *
 * Every source here is key-free and openly licensed: OpenFreeMap serves the
 * vector styles, and the USGS National Map serves the imagery and topographic
 * raster tiles. Nothing in this file requires an account, an access token, or
 * an environment variable.
 */

const OPENFREEMAP_HOST = 'https://tiles.openfreemap.org'
const USGS_HOST = 'https://basemap.nationalmap.gov/arcgis/rest/services'

/**
 * OpenFreeMap's glyph endpoint. Raster styles need this declared explicitly:
 * a raster-only style has no glyphs of its own, and the app layers symbol
 * layers with text labels on top of whichever basemap is active.
 */
export const GLYPHS_URL = `${OPENFREEMAP_HOST}/fonts/{fontstack}/{range}.pbf`

/**
 * OpenFreeMap serves the Noto Sans stack, not MapLibre's built-in default of
 * "Open Sans Regular". Any symbol layer the app adds must ask for this
 * explicitly or its glyph requests 404 and the labels never draw.
 */
export const DEFAULT_TEXT_FONT = ['Noto Sans Regular']

const USGS_ATTRIBUTION =
  '<a href="https://www.usgs.gov/programs/national-geospatial-program/national-map" target="_blank" rel="noopener noreferrer">USGS The National Map</a>'

const openFreeMapStyle = (name: string) => `${OPENFREEMAP_HOST}/styles/${name}`

const usgsTileUrl = (service: string) =>
  `${USGS_HOST}/${service}/MapServer/tile/{z}/{y}/{x}`

/**
 * A single representative tile used as the selector thumbnail. Zoom 6 over
 * central New Mexico — the same framing the previous Mapbox static previews
 * used. ArcGIS tile paths are {z}/{row}/{col}, so y precedes x.
 */
const usgsPreviewUrl = (service: string) =>
  `${USGS_HOST}/${service}/MapServer/tile/6/25/13`

/**
 * Wraps a USGS raster tile service in a minimal MapLibre style. `maxzoom` is
 * the deepest level the service caches; MapLibre overzooms past it rather than
 * requesting tiles that would 404.
 */
const usgsRasterStyle = (
  service: string,
  maxzoom: number
): StyleSpecification => ({
  version: 8,
  glyphs: GLYPHS_URL,
  sources: {
    [service]: {
      type: 'raster',
      tiles: [usgsTileUrl(service)],
      tileSize: 256,
      maxzoom,
      attribution: USGS_ATTRIBUTION,
    },
  },
  layers: [
    {
      id: service,
      type: 'raster',
      source: service,
    },
  ],
})

export interface BasemapDefinition {
  /** Stable key persisted in component state and analytics. */
  id: string
  title: string
  /** A style URL for vector basemaps, or an inline style for raster ones. */
  style: string | StyleSpecification
  /**
   * Static thumbnail for the selector. Raster basemaps can point at a single
   * tile; vector basemaps have no static endpoint and render a live preview.
   */
  previewUrl?: string
}

export const BASEMAPS: BasemapDefinition[] = [
  { id: 'light', title: 'Light', style: openFreeMapStyle('positron') },
  { id: 'dark', title: 'Dark', style: openFreeMapStyle('dark') },
  { id: 'streets', title: 'Streets', style: openFreeMapStyle('bright') },
  { id: 'detailed', title: 'Detailed', style: openFreeMapStyle('liberty') },
  {
    id: 'satellite',
    title: 'Satellite',
    style: usgsRasterStyle('USGSImageryOnly', 16),
    previewUrl: usgsPreviewUrl('USGSImageryOnly'),
  },
  {
    id: 'satellite-labels',
    title: 'Satellite + Labels',
    style: usgsRasterStyle('USGSImageryTopo', 16),
    previewUrl: usgsPreviewUrl('USGSImageryTopo'),
  },
  {
    id: 'topo',
    title: 'Topographic',
    style: usgsRasterStyle('USGSTopo', 16),
    previewUrl: usgsPreviewUrl('USGSTopo'),
  },
  {
    id: 'shaded-relief',
    title: 'Shaded Relief',
    style: usgsRasterStyle('USGSShadedReliefOnly', 15),
    previewUrl: usgsPreviewUrl('USGSShadedReliefOnly'),
  },
]

export const LIGHT_BASEMAP_ID = 'light'
export const DARK_BASEMAP_ID = 'dark'
export const DEFAULT_BASEMAP_ID = LIGHT_BASEMAP_ID

/** The basemap that tracks the app's color mode, keyed by that mode. */
export const THEMED_BASEMAP_IDS = {
  light: LIGHT_BASEMAP_ID,
  dark: DARK_BASEMAP_ID,
} as const

const BASEMAPS_BY_ID = new Map(BASEMAPS.map((basemap) => [basemap.id, basemap]))

export const getBasemap = (id: string): BasemapDefinition =>
  BASEMAPS_BY_ID.get(id) ?? BASEMAPS_BY_ID.get(DEFAULT_BASEMAP_ID)!

export const getBasemapStyle = (id: string) => getBasemap(id).style
