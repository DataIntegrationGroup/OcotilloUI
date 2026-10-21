// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useWellSeries,
  WELL_SERIES_QUERY_KEY,
} from '@/pages/ocotillo/hydrograph-correction/useWellSeries'
import { fetchAllOcotilloPages } from '@/utils/ocotilloPaging'

vi.mock('@/utils/ocotilloPaging', () => ({ fetchAllOcotilloPages: vi.fn() }))

// Refine's own cache invalidation, which needs a <Refine> to run for real.
const refineInvalidate = vi.fn()
vi.mock('@refinedev/core', () => ({ useInvalidate: () => refineInvalidate }))

const TRANSDUCER = 'observation/transducer-groundwater-level'

// What the API holds for the well; a publish adds to it.
let stored: Array<{ id: number }> = []

const fetchMock = vi.mocked(fetchAllOcotilloPages)
const transducerFetches = () =>
  fetchMock.mock.calls.filter(([resource]) => resource === TRANSDUCER).length

const setup = (wellId: number | null) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useWellSeries(wellId), { wrapper })
  return { queryClient, ...hook }
}

beforeEach(() => {
  stored = [{ id: 1 }, { id: 2 }]
  fetchMock.mockReset()
  refineInvalidate.mockReset()
  fetchMock.mockImplementation((async (resource: string) =>
    resource === TRANSDUCER ? [...stored] : []) as never)
})

describe('useWellSeries', () => {
  it('shows the series a publish just stored once the series is refreshed', async () => {
    const { result } = setup(7)
    await waitFor(() =>
      expect(result.current.wellSeriesQuery.data?.transducerRows).toHaveLength(
        2
      )
    )

    // A publish lands two more readings.
    stored = [...stored, { id: 3 }, { id: 4 }]
    await act(async () => {
      await result.current.invalidateStoredSeries()
    })

    await waitFor(() =>
      expect(result.current.wellSeriesQuery.data?.transducerRows).toHaveLength(
        4
      )
    )
    expect(transducerFetches()).toBe(2)
  })

  it('still refreshes Refine’s list cache, which the well pages read', async () => {
    const { result } = setup(7)
    await waitFor(() =>
      expect(result.current.wellSeriesQuery.isSuccess).toBe(true)
    )

    await act(async () => {
      await result.current.invalidateStoredSeries()
    })

    expect(refineInvalidate).toHaveBeenCalledWith({
      resource: TRANSDUCER,
      dataProviderName: 'ocotillo',
      invalidates: ['list'],
    })
  })

  it('is not reached by invalidating Refine’s list cache, which is the bug', async () => {
    const { result, queryClient } = setup(7)
    await waitFor(() =>
      expect(result.current.wellSeriesQuery.data?.transducerRows).toHaveLength(
        2
      )
    )

    stored = [...stored, { id: 3 }]
    // What the page used to do after a publish: invalidate the resource's
    // lists in Refine's cache. The chart's own query key is not under it.
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: ['data', 'ocotillo', TRANSDUCER, 'list'],
      })
    })

    expect(transducerFetches()).toBe(1)
    expect(result.current.wellSeriesQuery.data?.transducerRows).toHaveLength(2)
  })

  it('marks a cached series for another well stale too', async () => {
    const { result, queryClient } = setup(7)
    await waitFor(() =>
      expect(result.current.wellSeriesQuery.isSuccess).toBe(true)
    )
    // A publish still running when the user switched wells belongs to the
    // well it started on, which is no longer the one on screen.
    queryClient.setQueryData([WELL_SERIES_QUERY_KEY, 9], {
      manualRows: [],
      transducerRows: [],
    })

    await act(async () => {
      await result.current.invalidateStoredSeries()
    })

    expect(
      queryClient.getQueryState([WELL_SERIES_QUERY_KEY, 9])?.isInvalidated
    ).toBe(true)
  })

  it('fetches nothing until a well is chosen', async () => {
    const { result } = setup(null)

    await act(async () => {
      await result.current.invalidateStoredSeries()
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.wellSeriesQuery.data).toBeUndefined()
  })
})
