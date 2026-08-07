import { useEffect, useRef } from 'react'
import { useDataProvider, type BaseKey } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { captureEvent } from '@/analytics/posthog'
import { withRetry } from '@/utils/httpRetry'
import { DEFAULT_TEXT_FONT } from '@/basemaps'

// ---------------------------------------------------------------------------
// useOGCLayer
//
// React hook that loads a single map layer from the OGC API and returns
// everything Mapbox needs to render it.
//
// OGC (Open Geospatial Consortium) is an international standard for sharing
// geographic data over the web. Our API exposes named "collections" of map
// features — e.g., "water_wells" or "locations" — that conform to this standard.
//
// A collection can contain tens of thousands of features. To avoid downloading
// everything at once, this hook fetches features in pages (batches of 1,000),
// stitches them together, and hands the combined dataset to Mapbox.
// ---------------------------------------------------------------------------

/** Visual gradient scale shown in the map legend for a data-driven color layer. */
type LayerLegendScale = {
  gradient: string
  minLabel: string
  maxLabel: string
}

/** A single map feature: one point, line, or polygon with attached data properties. */
type OGCFeature = {
  type: string
  geometry: { type: string; coordinates: unknown[] } | null | undefined
  properties: Record<string, unknown> | null
}

/**
 * The shape of one page of results returned by the OGC API.
 *
 * `numberMatched` is the server's total count of features matching the query —
 * it may be much larger than the features in any single page. We use it to
 * know when we've loaded everything, or how far short we fell if we hit a cap.
 */
type OGCFeatureCollection = {
  type: string
  features: OGCFeature[]
  numberMatched?: number  // Total records on the server matching this query
  numberReturned?: number // Records included in this single response
}

/** What one page fetch returns from the data provider. */
type FetchPageResult = { data: OGCFeatureCollection | unknown }

/** A function that fetches one page of features starting at `offset`. */
export type FetchPageFn = (offset: number) => Promise<FetchPageResult>

/**
 * The outcome of loading a layer's features:
 * - `complete`      — All available features were loaded; nothing was cut off.
 * - `truncated`     — Loading stopped before all features were retrieved
 *                     (hit the browser safety cap, or the server reported more
 *                     features than we loaded).
 * - `partial-error` — A network or response error interrupted loading;
 *                     features collected before the error are still usable.
 */
export type OGCLoadStatus = 'complete' | 'truncated' | 'partial-error'

/**
 * The reason the paging loop stopped. Captured so we can derive the correct
 * loadStatus without re-examining counts after the fact.
 *
 * Defaults to 'ceiling' (the loop ran out of allowed pages) — the safest
 * assumption when no explicit stop reason was recorded.
 */
type ExitReason =
  | 'numberMatched'   // Server confirmed we have all features
  | 'shortPage'       // Server returned fewer features than requested — nothing left
  | 'maxFeatures'     // Hit the browser safety cap
  | 'ceiling'         // Ran out of allowed page requests
  | 'invalidResponse' // Server returned something that wasn't a FeatureCollection
  | 'error'           // Network or provider error

// ---------------------------------------------------------------------------
// fetchOGCFeaturePages
//
// The core paging engine. Repeatedly calls fetchPage(offset) until one of
// the stop conditions below is met, then returns everything collected.
//
// Exported separately from useOGCLayer so it can be unit-tested directly
// without needing to render a React component.
// ---------------------------------------------------------------------------

export async function fetchOGCFeaturePages(
  fetchPage: FetchPageFn,
  {
    pageSize,
    pageCeiling,
    maxFeatures,
    requireGeometry,
  }: {
    pageSize: number     // Max features to request per page
    pageCeiling: number  // Max number of pages to fetch before giving up
    maxFeatures: number  // Hard browser-side cap on total features loaded
    requireGeometry: boolean // Drop features that have no map coordinates
  }
): Promise<{
  features: OGCFeature[]
  loadedCount: number
  totalMatched: number | undefined
  loadStatus: OGCLoadStatus
}> {
  // Guard against pageSize <= 0: offset would never advance, causing an
  // infinite loop that hammers the backend until pageCeiling is reached.
  if (pageSize <= 0) {
    throw new Error(`fetchOGCFeaturePages: pageSize must be a positive integer, got ${pageSize}`)
  }

  let offset = 0                          // How many features to skip (advances by pageSize each page)
  let pageCount = 0                       // Pages fetched so far
  const allFeatures: OGCFeature[] = []   // Accumulates features across all pages
  let numberMatched: number | undefined   // Server's reported total (updated each page if present)
  let exitReason: ExitReason = 'ceiling' // Why the loop stopped; ceiling is the safe default

  while (pageCount < pageCeiling && allFeatures.length < maxFeatures) {
    let result: FetchPageResult

    try {
      result = await fetchPage(offset)
    } catch (err) {
      // Network failure or persistent server error after retries — save what we have.
      console.error('[useOGCLayer] page fetch failed at offset', offset, err)
      exitReason = 'error'
      break
    }

    const featureCollection = result?.data as OGCFeatureCollection

    if (!featureCollection || featureCollection.type !== 'FeatureCollection') {
      // The server returned something unexpected (an error object, HTML, etc.).
      exitReason = 'invalidResponse'
      break
    }

    const rawFeatures = Array.isArray(featureCollection.features)
      ? featureCollection.features
      : []

    // Optionally discard features that have no map coordinates.
    // A feature without geometry can't be plotted on the map.
    const features = requireGeometry
      ? rawFeatures.filter(
          (f) =>
            Boolean(f?.geometry) &&
            typeof f.geometry?.type === 'string' &&
            Array.isArray(f.geometry?.coordinates)
        )
      : rawFeatures

    // Add this page's features, but never exceed the safety cap.
    const remaining = Math.max(0, maxFeatures - allFeatures.length)
    allFeatures.push(...features.slice(0, remaining))

    // Capture the server's total count when provided. We trust the last
    // page's value since some servers update it as results are streamed.
    if (typeof featureCollection.numberMatched === 'number') {
      numberMatched = featureCollection.numberMatched
    }

    // --- Stop conditions (checked in priority order) ---

    if (allFeatures.length >= maxFeatures) {
      // Hit the browser safety cap. We may or may not have loaded everything —
      // numberMatched (if present) will clarify this when we compute loadStatus.
      exitReason = 'maxFeatures'
      break
    }

    if (numberMatched !== undefined && allFeatures.length >= numberMatched) {
      // The server told us the total, and we've loaded it all.
      exitReason = 'numberMatched'
      break
    }

    // Short-page heuristic: a page smaller than pageSize usually means we've
    // reached the end of the dataset. However, when numberMatched is present
    // it's the authoritative source — some servers enforce a lower page cap
    // than requested, so a short page doesn't necessarily mean "nothing left."
    // We always stop on an empty page regardless, since no progress is possible.
    if (rawFeatures.length === 0 || (numberMatched === undefined && rawFeatures.length < pageSize)) {
      exitReason = 'shortPage'
      break
    }

    // Advance the offset by how many features the server actually returned,
    // not by pageSize. These differ when the server enforces its own page cap
    // lower than what we requested — advancing by pageSize would skip features.
    offset += rawFeatures.length
    pageCount += 1
  }

  const loadedCount = allFeatures.length

  // Map exit reason to a user-facing load status.
  let loadStatus: OGCLoadStatus
  if (exitReason === 'error' || exitReason === 'invalidResponse') {
    loadStatus = 'partial-error'
  } else if (exitReason === 'numberMatched' || exitReason === 'shortPage') {
    loadStatus = 'complete'
  } else if (exitReason === 'maxFeatures') {
    // If the server confirmed the total and it matches what we loaded, nothing
    // was left behind — report complete even though we hit the cap.
    loadStatus =
      numberMatched !== undefined && numberMatched <= loadedCount
        ? 'complete'
        : 'truncated'
  } else {
    // ceiling, or any future unhandled reason — assume incomplete to be safe.
    loadStatus = 'truncated'
  }

  return { features: allFeatures, loadedCount, totalMatched: numberMatched, loadStatus }
}

// ---------------------------------------------------------------------------
// useOGCLayer (the hook itself)
//
// Wraps fetchOGCFeaturePages in React Query so results are cached and shared
// across components. Also handles color mapping, text labels, and Mapbox layer
// configuration — everything the map panel needs to render one layer.
// ---------------------------------------------------------------------------

export const useOGCLayer = ({
  collection,
  label,
  providerName = 'ogcapi',
  color = '#9cd0ab',
  colorAccessor,
  textAccessor,
  textColor = '#111111',
  layerType = 'circle',
  paint,
  colorExpression,
  legendColor,
  legendScale,
  colorMappingEnabled = true,
  requestParams,
  enabled = true,
  pageSize = 1000,
  maxPages,
  maxFeatures = 20000,
  requireGeometry = true,
}: {
  collection: string              // OGC collection ID to load (e.g., "water_wells")
  label: string                   // Human-readable name shown in the layer panel
  providerName?: string           // Which data provider to use (defaults to 'ogcapi')
  color?: string                  // Default dot/line color when no color mapping is active
  colorAccessor?: (feature: OGCFeature) => string | undefined  // Per-feature color function
  textAccessor?: (feature: OGCFeature) => string | undefined   // Per-feature label function
  textColor?: string
  layerType?: 'circle' | 'line' | 'fill'
  paint?: Record<string, unknown>             // Mapbox paint overrides
  colorExpression?: unknown                   // Mapbox expression for data-driven color
  legendColor?: string                        // Color swatch shown in the legend
  legendScale?: LayerLegendScale             // Gradient scale shown in the legend
  colorMappingEnabled?: boolean
  requestParams?: Record<string, string | number | boolean>  // Extra OGC query params
  enabled?: boolean               // Set false to skip loading (e.g., layer is hidden)
  pageSize?: number               // Features per page request (default 1,000)
  maxPages?: number               // Optional hard limit on page count; derived from maxFeatures if omitted
  maxFeatures?: number            // Browser safety cap on total features (default 20,000)
  requireGeometry?: boolean       // Drop features with no map coordinates (default true)
}) => {
  const dataProvider = useDataProvider()

  const requestParamsKey = requestParams ? JSON.stringify(requestParams) : ''

  // Derive how many pages we're willing to fetch from the feature cap.
  // e.g., maxFeatures=20,000 ÷ pageSize=1,000 → ceiling of 20 pages.
  // A caller can override this with an explicit maxPages argument.
  const pageCeiling = maxPages ?? Math.ceil(maxFeatures / pageSize)

  const { data, isLoading } = useQuery({
    // The query key uniquely identifies this request. React Query uses it to
    // cache and share results — the same key returns the same cached data.
    queryKey: [
      'ogcapi-layer',
      providerName,
      collection,
      requestParamsKey,
      pageSize,
      pageCeiling,
      maxFeatures,
      requireGeometry,
    ],
    gcTime: 60000,    // Keep cached data in memory for 60 s after the layer unmounts
    staleTime: 30000, // Treat data as fresh for 30 s before allowing a background re-fetch
    enabled: enabled && collection.length > 0,
    queryFn: async () => {
      const loadStartedAt = performance.now()
      const provider = dataProvider(providerName)

      // Wrap each page request in withRetry so transient server errors
      // (rate limits, temporary outages) are retried automatically.
      const fetchPage: FetchPageFn = (offset) =>
        withRetry(
          () =>
            provider.getOne({
              resource: providerName,
              // Collection list fetch — no feature id; OGC path is .../items?f=json
              id: null as unknown as BaseKey,
              meta: {
                requestConfig: {
                  params: {
                    collection,
                    f: 'json',
                    limit: pageSize,
                    offset,
                    ...(requestParams || {}),
                  },
                },
              },
            }) as Promise<FetchPageResult>,
          {
            retries: 4,
            baseDelayMs: 450,
            maxDelayMs: 6000,
            jitter: true,                              // Randomise retry timing to avoid thundering herd
            retryOnStatuses: [429, 502, 503, 504],    // Rate-limited or server-error responses only
          }
        )

      const { features, loadedCount, totalMatched, loadStatus } =
        await fetchOGCFeaturePages(fetchPage, {
          pageSize,
          pageCeiling,
          maxFeatures,
          requireGeometry,
        })

      const pageCount = Math.ceil((loadedCount || 0) / pageSize) || 0

      return {
        type: 'FeatureCollection',
        features,
        loadedCount,
        totalMatched,
        loadStatus,
        pageCount,
        loadDurationMs: Math.round(performance.now() - loadStartedAt),
      }
    },
  })

  const lastReportedLoadKey = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || isLoading || !data || data.type !== 'FeatureCollection') return

    const loadKey = `${collection}:${String(data.loadStatus)}:${String(data.loadedCount)}`
    if (lastReportedLoadKey.current === loadKey) return
    lastReportedLoadKey.current = loadKey

    captureEvent('map_layer_loaded', {
      layer_key: collection,
      feature_count: data.loadedCount ?? data.features?.length ?? 0,
      total_matched: data.totalMatched,
      load_status: data.loadStatus,
      page_count: data.pageCount,
      page_size: pageSize,
      max_features: maxFeatures,
      load_duration_ms: data.loadDurationMs,
    })
  }, [
    enabled,
    isLoading,
    data,
    collection,
    pageSize,
    maxFeatures,
  ])

  // Guard against undefined data while loading or if the query hasn't run yet.
  const safeGeoJSONBase =
    data && data.type === 'FeatureCollection'
      ? data
      : { type: 'FeatureCollection', features: [] }

  // Inject resolved color and label as special properties on each feature.
  // Mapbox reads these via ['get', '__color'] and ['get', '__label'] expressions
  // defined in the layer paint below, allowing per-feature styling without
  // changing the original feature data.
  const safeGeoJSON = {
    ...safeGeoJSONBase,
    features: (safeGeoJSONBase.features || []).map((feature: OGCFeature) => {
      const resolvedColor = colorAccessor?.(feature)
      const resolvedText = textAccessor?.(feature)
      return {
        ...feature,
        properties: {
          ...(feature?.properties || {}),
          ...(resolvedColor ? { __color: resolvedColor } : {}),
          ...(resolvedText ? { __label: resolvedText } : {}),
        },
      }
    }),
  }

  // --- Color resolution ---
  // Priority: data-driven colorExpression > per-feature colorAccessor > flat color.
  // When color mapping is disabled by the user, always use the flat fallback color.
  const hasColorMapping = Boolean(colorAccessor || colorExpression || legendScale)
  const resolvedColor = colorAccessor
    ? (['coalesce', ['get', '__color'], color] as unknown) // Read __color, fall back to default
    : color
  const fallbackColor = legendColor || color
  const effectiveColor =
    hasColorMapping && colorMappingEnabled
      ? colorExpression ?? resolvedColor
      : fallbackColor

  // Default Mapbox paint styles per geometry type. Callers may override
  // individual properties via the `paint` prop.
  const defaultPaintByType: Record<
    'circle' | 'line' | 'fill',
    Record<string, unknown>
  > = {
    circle: {
      'circle-radius': 3,
      'circle-color': effectiveColor,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
    line: {
      'line-color': effectiveColor,
      'line-width': 1.5,
      'line-opacity': 0.9,
    },
    fill: {
      'fill-color': effectiveColor,
      'fill-opacity': 0.4,
    },
  }

  return {
    // MapLibre source configuration. `type` is asserted so it narrows to the
    // "geojson" literal the Source component's discriminated union expects,
    // rather than widening to string.
    sourceProps: { type: 'geojson' as const, data: safeGeoJSON },
    sourceData: safeGeoJSON,                              // Raw GeoJSON for consumers that need it
    legendColor: fallbackColor,
    legendScale: hasColorMapping && colorMappingEnabled ? legendScale : undefined,
    colorMappingAvailable: hasColorMapping,
    colorMappingEnabled: hasColorMapping ? colorMappingEnabled : false,
    loadedCount: data?.loadedCount as number | undefined,     // Features successfully loaded
    totalMatched: data?.totalMatched as number | undefined,   // Server's reported total (if known)
    loadStatus: data?.loadStatus as OGCLoadStatus | undefined, // Outcome of the load
    layerProps: {
      label,
      type: layerType,
      paint: {
        ...defaultPaintByType[layerType],
        ...(paint || {}), // Caller overrides applied last
      },
    },
    // Symbol layer for text labels — only present when a textAccessor is configured.
    textLayerProps: textAccessor
      ? {
          type: 'symbol' as const,
          layout: {
            'text-field': ['get', '__label'],
            // MapLibre defaults to "Open Sans Regular", which the OpenFreeMap
            // glyph server does not serve. Ask for a stack it has, or the
            // glyph request 404s and the labels never draw.
            'text-font': DEFAULT_TEXT_FONT,
            'text-size': 19,
            'text-anchor': 'top-left',
            'text-offset': [0.35, 0.35],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': textColor,
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.4,
          },
        }
      : undefined,
    isLoading,
  }
}
