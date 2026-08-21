import { useDataProvider, useList } from '@refinedev/core'
import { useCallback, useMemo } from 'react'
import {
  CHEMISTRY_REPORT_PAGE_SIZE,
  chemistryReportYearOf,
  chemistryReportYearParams,
  sortChemistryResults,
} from '@/utils/chemistryReport'
import type { ChemistryResult } from './useChemistryReportData'

const CHEMISTRY_RESOURCE = 'chemistry/results'

/**
 * Which year of chemistry a well's report should cover, and a way to pull it.
 *
 * Reads `chemistry/results`, which serves the legacy NMA chemistry tables. The
 * refactored `observation/water-chemistry` endpoint holds no water chemistry at
 * all, so a report built on it came back empty for every well.
 *
 * The report covers one calendar year, and the year worth reporting on is the
 * most recent one sampled: a well last sampled in 2024 would otherwise produce
 * an empty report for the current year. One row is enough to find it.
 *
 * A well with nothing on file still gets a year — the current one — because a
 * report that says the well has no results on it is a legitimate thing to hand
 * an owner, and is what the chemistry exporter already produces. `hasChemistry`
 * is there to say so up front, not to block the report.
 *
 * The year's results are left until `fetchYearObservations` is called, since
 * most visits to a well page are not after a chemistry report.
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

  const fetchYearObservations = useCallback(
    async (year: number) => {
      if (thingId == null) return []

      const params = { thing_id: thingId, ...chemistryReportYearParams(year) }
      const collected: ChemistryResult[] = []
      let currentPage = 1

      while (true) {
        const page = await ocotilloDataProvider.getList({
          resource: CHEMISTRY_RESOURCE,
          pagination: { currentPage, pageSize: CHEMISTRY_REPORT_PAGE_SIZE },
          meta: { params },
        })

        collected.push(...(page.data as ChemistryResult[]))

        if (page.data.length === 0 || collected.length >= page.total) break
        currentPage += 1
      }

      return sortChemistryResults(collected)
    },
    [ocotilloDataProvider, thingId]
  )

  return {
    reportYear: latestSampledYear ?? new Date().getFullYear(),
    latestSampledYear,
    hasChemistry: latestSampledYear != null,
    isLoading: enabled && Boolean(thingId) ? query.isLoading : false,
    fetchYearObservations,
  }
}
