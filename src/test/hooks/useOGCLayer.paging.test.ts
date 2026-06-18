// ---------------------------------------------------------------------------
// Tests for fetchOGCFeaturePages — the paging engine inside useOGCLayer.
//
// These tests exercise the logic that decides when to keep fetching pages,
// when to stop, and what load status to report. They do not render any
// React components; they call the helper function directly with a mock
// "fetch one page" function that simulates server responses.
// ---------------------------------------------------------------------------

import { describe, it, expect, vi } from 'vitest'
import { fetchOGCFeaturePages } from '@/hooks/useOGCLayer'

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

/** Creates a minimal valid map feature with a real point geometry. */
const makeFeature = (id: number) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { id },
})

/** Creates a feature with no geometry — simulates records missing coordinates. */
const makeFeatureNoGeometry = (id: number) => ({
  type: 'Feature',
  geometry: null,
  properties: { id },
})

/**
 * Wraps features in the OGC FeatureCollection envelope that the server returns.
 *
 * `numberMatched` is optional — the server includes it when it can report the
 * full dataset size. Omitting it simulates a server that doesn't report totals.
 */
const makeCollection = (
  features: ReturnType<typeof makeFeature | typeof makeFeatureNoGeometry>[],
  numberMatched?: number
) => ({
  data: {
    type: 'FeatureCollection',
    features,
    ...(numberMatched !== undefined ? { numberMatched } : {}),
  },
})

/**
 * Default paging options used across most tests.
 * Values are intentionally small to keep test data readable:
 * - pageSize 10   → each mock page holds up to 10 features
 * - pageCeiling 100 → up to 100 pages before giving up (effectively unlimited for these tests)
 * - maxFeatures 1000 → browser cap high enough not to interfere
 * - requireGeometry true → default: drop features with no coordinates
 */
const defaultOpts = {
  pageSize: 10,
  pageCeiling: 100,
  maxFeatures: 1000,
  requireGeometry: true,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchOGCFeaturePages', () => {
  it('loads all pages when numberMatched is present and within maxFeatures', async () => {
    // Simulates a collection of 25 features spread across 3 pages (10, 10, 5).
    // The server reports numberMatched=25 on every page.
    const totalFeatures = 25
    const fetchPage = vi.fn(async (offset: number) => {
      const slice = Array.from(
        { length: Math.min(10, totalFeatures - offset) },
        (_, i) => makeFeature(offset + i)
      )
      return makeCollection(slice, totalFeatures)
    })

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(25)
    expect(result.loadedCount).toBe(25)
    expect(result.totalMatched).toBe(25)
    expect(result.loadStatus).toBe('complete')
    expect(fetchPage).toHaveBeenCalledTimes(3) // Pages: offset 0, 10, 20
  })

  it('reports complete (not truncated) when numberMatched exactly equals maxFeatures', async () => {
    // Edge case: the dataset happens to be the same size as the browser cap.
    // Even though we hit maxFeatures, the server confirms there's nothing more —
    // so the correct status is 'complete', not 'truncated'.
    const fetchPage = vi.fn(async (offset: number) => {
      const slice = Array.from({ length: 10 }, (_, i) => makeFeature(offset + i))
      return makeCollection(slice, 20) // Server says: 20 features total
    })

    const result = await fetchOGCFeaturePages(fetchPage, {
      ...defaultOpts,
      maxFeatures: 20,  // Cap equals the total
      pageCeiling: 2,
    })

    expect(result.features).toHaveLength(20)
    expect(result.loadedCount).toBe(20)
    expect(result.totalMatched).toBe(20)
    expect(result.loadStatus).toBe('complete') // Not 'truncated' — we got everything
  })

  it('stops at maxFeatures and reports truncated when numberMatched exceeds cap', async () => {
    // Simulates a very large collection (50,000 features) with a small cap (25).
    // The browser stops loading after 25 features; status should be 'truncated'.
    const fetchPage = vi.fn(async (offset: number) => {
      const slice = Array.from({ length: 10 }, (_, i) => makeFeature(offset + i))
      return makeCollection(slice, 50000) // Server has 50,000; we only load 25
    })

    const result = await fetchOGCFeaturePages(fetchPage, {
      pageSize: 10,
      pageCeiling: 100,
      maxFeatures: 25, // Stop after 25
      requireGeometry: true,
    })

    expect(result.features).toHaveLength(25)
    expect(result.loadedCount).toBe(25)
    expect(result.totalMatched).toBe(50000)
    expect(result.loadStatus).toBe('truncated')
  })

  it('stops on a short page when numberMatched is absent and reports complete', async () => {
    // Some servers don't report numberMatched. We detect "nothing left" by
    // receiving a page smaller than pageSize (a "short page").
    // Pages: 10 features, 10 features, then 3 features → stop.
    const fetchPage = vi.fn(async (offset: number) => {
      const count = offset < 20 ? 10 : 3
      const slice = Array.from({ length: count }, (_, i) => makeFeature(offset + i))
      return makeCollection(slice) // No numberMatched
    })

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(23) // 10 + 10 + 3
    expect(result.loadedCount).toBe(23)
    expect(result.totalMatched).toBeUndefined() // Server didn't report a total
    expect(result.loadStatus).toBe('complete')
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })

  it('preserves already-fetched features and reports partial-error on mid-load failure', async () => {
    // Simulates a network error on the 3rd page request.
    // The first two pages (20 features) should be preserved and returned,
    // with loadStatus 'partial-error' to signal the data is incomplete.
    let callCount = 0
    const fetchPage = vi.fn(async (offset: number) => {
      callCount += 1
      if (callCount === 3) throw new Error('upstream error')
      const slice = Array.from({ length: 10 }, (_, i) => makeFeature(offset + i))
      return makeCollection(slice, 50)
    })

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(20) // Pages 1 and 2 survived
    expect(result.loadedCount).toBe(20)
    expect(result.loadStatus).toBe('partial-error')
  })

  it('reports partial-error when the first response is not a FeatureCollection', async () => {
    // The server returned something unexpected (e.g., an error object or HTML).
    // We have zero features and can't continue — treat it as a failed load.
    const fetchPage = vi.fn(async () => ({ data: { type: 'Error', message: 'bad' } }))

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(0)
    expect(result.loadStatus).toBe('partial-error')
    expect(fetchPage).toHaveBeenCalledTimes(1) // Didn't retry after the bad response
  })

  it('makes exactly one request for a single-page collection', async () => {
    // A small collection (5 features) that fits in one page.
    // The server confirms numberMatched=5, so we know we're done after one request.
    const fetchPage = vi.fn(async () =>
      makeCollection(
        Array.from({ length: 5 }, (_, i) => makeFeature(i)),
        5
      )
    )

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(5)
    expect(result.loadStatus).toBe('complete')
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('filters out features with missing or invalid geometry when requireGeometry is true', async () => {
    // The server returns 4 features but 2 have no usable coordinates:
    //   feature 1 — valid point
    //   feature 2 — geometry is null (no location recorded)
    //   feature 3 — valid point
    //   feature 4 — geometry.coordinates is a string, not an array (malformed)
    // With requireGeometry=true, only features 1 and 3 should be kept.
    // Note: totalMatched reflects the server's count (4), not the filtered count.
    // No numberMatched — the short-page heuristic stops after this one page.
    const fetchPage = vi.fn(async () =>
      makeCollection([
        makeFeature(1),
        makeFeatureNoGeometry(2),
        makeFeature(3),
        { type: 'Feature', geometry: { type: 'Point', coordinates: 'bad' as unknown as number[] }, properties: { id: 4 } },
      ])
    )

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(2)
    expect(result.features.map((f) => f.properties?.id)).toEqual([1, 3])
    expect(result.totalMatched).toBeUndefined()
    expect(result.loadStatus).toBe('complete')
  })

  it('preserves features with missing geometry when requireGeometry is false', async () => {
    // Some layer types (e.g., reference data) intentionally include records
    // without coordinates. Setting requireGeometry=false keeps them all.
    const fetchPage = vi.fn(async () =>
      makeCollection([
        makeFeature(1),
        makeFeatureNoGeometry(2),
        makeFeature(3),
      ], 3)
    )

    const result = await fetchOGCFeaturePages(fetchPage, {
      ...defaultOpts,
      requireGeometry: false,
    })

    expect(result.features).toHaveLength(3) // All 3 preserved, including the geometry-less one
    expect(result.loadStatus).toBe('complete')
  })

  it('continues paging past a short page when numberMatched confirms more features exist', async () => {
    // Simulates a server that caps page size at 5 even though we request 10.
    // Without numberMatched, we'd incorrectly stop after the first "short" page.
    // With numberMatched=15, we know to keep going until all features are loaded.
    const totalFeatures = 15
    const serverPageCap = 5 // Server enforces its own smaller page size
    const fetchPage = vi.fn(async (offset: number) => {
      const slice = Array.from(
        { length: Math.min(serverPageCap, totalFeatures - offset) },
        (_, i) => makeFeature(offset + i)
      )
      return makeCollection(slice, totalFeatures) // Server reports the true total
    })

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(15)
    expect(result.loadStatus).toBe('complete')
    expect(fetchPage).toHaveBeenCalledTimes(3) // 5 + 5 + 5, not stopped early
  })

  it('stops immediately on an empty page even when numberMatched says more exist', async () => {
    // If the server returns an empty page, no progress is possible —
    // continuing would loop forever. Stop and report what we have.
    let callCount = 0
    const fetchPage = vi.fn(async (offset: number) => {
      callCount += 1
      if (callCount === 2) return makeCollection([], 50) // Unexpected empty page mid-load
      const slice = Array.from({ length: 10 }, (_, i) => makeFeature(offset + i))
      return makeCollection(slice, 50)
    })

    const result = await fetchOGCFeaturePages(fetchPage, { ...defaultOpts })

    expect(result.features).toHaveLength(10) // Only the first page made it
    expect(result.loadStatus).toBe('complete') // shortPage exit (empty page = nothing left signal)
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('throws when pageSize is zero or negative', async () => {
    // pageSize <= 0 would cause offset to never advance, creating an infinite
    // loop that hammers the backend. Fail fast instead.
    const fetchPage = vi.fn()

    await expect(
      fetchOGCFeaturePages(fetchPage, { ...defaultOpts, pageSize: 0 })
    ).rejects.toThrow('pageSize must be a positive integer')

    await expect(
      fetchOGCFeaturePages(fetchPage, { ...defaultOpts, pageSize: -5 })
    ).rejects.toThrow('pageSize must be a positive integer')

    expect(fetchPage).not.toHaveBeenCalled() // Rejected before making any requests
  })
})
