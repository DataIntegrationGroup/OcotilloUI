import { useDataProvider, useList } from '@refinedev/core'
import { useCallback, useMemo } from 'react'
import {
  chemistryReportYearOf,
  type WaterLevelObservation,
} from '@/utils/chemistryReport'
import {
  CHEMISTRY_RESOURCE,
  fetchAllChemistry,
  fetchContinuousWaterLevels,
  fetchReportWaterLevels,
  WATER_LEVEL_RESOURCE,
} from './chemistryReportFetchers'
import type { ChemistryResult } from './useChemistryReportData'

/**
 * What a well's report should cover, and a way to pull it.
 *
 * Chemistry is read from `chemistry/results`, which serves the legacy NMA
 * chemistry tables. The refactored `observation/water-chemistry` endpoint
 * holds no water chemistry at all, so a report built on it came back empty for
 * every well. The report carries the whole of that record, unwindowed.
 *
 * `reportYear` scopes the water levels alone, and is the most recent year the
 * well was measured in — read from `observation/groundwater-level`, since that
 * is what it scopes. One row from each endpoint is enough to settle both.
 *
 * A well with no readings still gets a year — the current one — so callers
 * always have something to render; `hasChemistry` says whether the chemistry
 * means anything. The well details page greys its report option out on that
 * flag, while the exporter still produces a no-results report, which is a
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

  // The reporting year scopes the water levels, so it is read from them:
  // the most recent year the well was actually measured in. Reading it from
  // the chemistry instead -- which it used to do, back when the year scoped
  // the chemistry too -- picked the year of a sample that may be a decade
  // old, and printed a water level section with nothing in it.
  const { result: latestReading, query: readingQuery } =
    useList<WaterLevelObservation>({
      resource: WATER_LEVEL_RESOURCE,
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

  const latestMeasuredYear = chemistryReportYearOf(
    latestReading?.data?.[0]?.observation_datetime
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
    // A well with no readings at all falls back to the current year, which
    // prints an empty water level section -- there is no year that would not.
    reportYear: latestMeasuredYear ?? new Date().getFullYear(),
    latestSampledYear,
    latestMeasuredYear,
    hasChemistry: latestSampledYear != null,
    isLoading:
      enabled && Boolean(thingId)
        ? query.isLoading || readingQuery.isLoading
        : false,
    fetchObservations,
    fetchWaterLevels,
    fetchContinuous,
  }
}
