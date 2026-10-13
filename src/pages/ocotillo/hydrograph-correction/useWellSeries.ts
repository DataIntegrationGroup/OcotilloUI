import { useInvalidate } from '@refinedev/core'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import type { IObservation } from '@/interfaces/ocotillo'
import { fetchAllOcotilloPages } from '@/utils/ocotilloPaging'

/** The query key's first element; the well's id follows it. */
export const WELL_SERIES_QUERY_KEY = 'hydrograph-correction-well-series'

/**
 * A well's manual measurements and stored transducer series, both charted in
 * full, so every page is fetched. A paginated list hook would cap the stored
 * trace at its first page -- a few hours of readings against a year-long
 * upload, which reads on the chart as "no stored data at all".
 *
 * This is a plain query, not a Refine list, so invalidating the Refine
 * resource after a publish or delete does not reach it. `invalidateStoredSeries`
 * refreshes both: without the second the chart kept the series it fetched
 * before the write until its five-minute staleTime ran out, or the page was
 * reloaded.
 */
export const useWellSeries = (wellId: number | string | null | undefined) => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidate()

  const wellSeriesQuery = useQuery({
    queryKey: [WELL_SERIES_QUERY_KEY, wellId ?? ''],
    enabled: Boolean(wellId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async ({ queryKey, signal }) => {
      const thingId = queryKey[1]
      if (thingId === '' || thingId == null) {
        return {
          manualRows: [] as IObservation[],
          transducerRows: [] as TransducerObservationWithBlockResponse[],
        }
      }

      const [manualRows, transducerRows] = await Promise.all([
        fetchAllOcotilloPages<IObservation>(
          'observation/groundwater-level',
          { thing_id: thingId },
          { signal }
        ),
        fetchAllOcotilloPages<TransducerObservationWithBlockResponse>(
          'observation/transducer-groundwater-level',
          { thing_id: thingId },
          { pageSize: 5000, signal }
        ),
      ])

      return { manualRows, transducerRows }
    },
  })

  /**
   * Refreshes everything that holds the stored series after a write: Refine's
   * list cache, which the well pages read, and the chart's own series here.
   * Resolves once the series on screen has been refetched.
   *
   * Every well's series is marked stale, not just the selected one: a publish
   * that is still running when the user switches wells belongs to the well it
   * started on.
   */
  const invalidateStoredSeries = () => {
    invalidate({
      resource: 'observation/transducer-groundwater-level',
      dataProviderName: 'ocotillo',
      invalidates: ['list'],
    })
    return queryClient.invalidateQueries({ queryKey: [WELL_SERIES_QUERY_KEY] })
  }

  return { wellSeriesQuery, invalidateStoredSeries }
}
