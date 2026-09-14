import { useDataProvider, useList } from '@refinedev/core'
import { useCallback, useMemo } from 'react'
import { chemistryReportYearOf } from '@/utils/chemistryReport'
import {
  CHEMISTRY_RESOURCE,
  fetchAllChemistry,
  fetchContinuousWaterLevels,
  fetchReportWaterLevels,
} from './chemistryReportFetchers'
import type { ChemistryResult } from './useChemistryReportData'

/**
 * Which year of chemistry a well's report should cover, and a way to pull it.
 *
 * Reads `chemistry/results`, which serves the legacy NMA chemistry tables. The
 * refactored `observation/water-chemistry` endpoint holds no water chemistry at
 * all, so a report built on it came back empty for every well.
 *
 * The chemistry itself is the well's whole record. `reportYear` scopes only
 * the water levels, and is the most recent year sampled: a well last sampled
 * in 2024 gets its 2024 water levels beside its chemistry rather than a year
 * of readings that no sample belongs to. One row is enough to find it.
 *
 * A well with nothing on file still gets a year — the current one — so callers
 * always have something to render; `hasChemistry` says whether it means
 * anything. The well details page greys its report option out on that flag,
 * while the standalone exporter still produces a no-results report, which is a
 * legitimate thing to hand an owner who asked for one by name.
 *
 * The data itself is left until one of the fetchers is called, since most
 * visits to a well page are not after a chemistry report.
 */
export const useWellChemistryReport = ({
  thingId,
  enabled = true,
}: {
  thingId: string | number | undefined
  enabled?: boolean
}) => {
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = useMemo(
    () => dataProvider('ocotillo'),
    [dataProvider]
  )

  const { result, query } = useList<ChemistryResult>({
    resource: CHEMISTRY_RESOURCE,
    dataProviderName: 'ocotillo',
    pagination: { currentPage: 1, pageSize: 1, mode: 'server' },
    sorters: [{ field: 'observation_datetime', order: 'desc' }],
    meta: { params: { thing_id: thingId } },
    queryOptions: {
      enabled: enabled && Boolean(thingId),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  })

  const latestSampledYear = chemistryReportYearOf(
    result?.data?.[0]?.observation_datetime
  )

  const fetchObservations = useCallback(
    async () =>
      thingId == null ? [] : fetchAllChemistry(ocotilloDataProvider, thingId),
    [ocotilloDataProvider, thingId]
  )

  const fetchWaterLevels = useCallback(
    async (year: number, { elevationFt }: { elevationFt?: number | null }) =>
      thingId == null
        ? []
        : fetchReportWaterLevels(ocotilloDataProvider, thingId, year, {
            elevationFt,
          }),
    [ocotilloDataProvider, thingId]
  )

  const fetchContinuous = useCallback(
    async (year: number) =>
      thingId == null
        ? null
        : fetchContinuousWaterLevels(ocotilloDataProvider, thingId, year),
    [ocotilloDataProvider, thingId]
  )

  return {
    reportYear: latestSampledYear ?? new Date().getFullYear(),
    latestSampledYear,
    hasChemistry: latestSampledYear != null,
    isLoading: enabled && Boolean(thingId) ? query.isLoading : false,
    fetchObservations,
    fetchWaterLevels,
    fetchContinuous,
  }
}
