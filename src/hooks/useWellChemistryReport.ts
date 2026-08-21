import { useDataProvider, useList } from '@refinedev/core'
import { useCallback, useMemo } from 'react'
import {
  CHEMISTRY_REPORT_PAGE_SIZE,
  chemistryReportYearOf,
  chemistryReportYearParams,
  sortChemistryObservations,
} from '@/utils/chemistryReport'
import type { ChemistryObservation } from './useChemistryReportData'

const CHEMISTRY_RESOURCE = 'observation/water-chemistry'

/**
 * Which year of chemistry a well's report should cover, and a way to pull it.
 *
 * The report covers one calendar year, and the year worth reporting on is the
 * most recent one sampled: a well last sampled in 2024 would otherwise produce
 * an empty report for the current year. One row is enough to find it, and it
 * doubles as the "has any chemistry at all" check.
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

  const { result, query } = useList<ChemistryObservation>({
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

  const reportYear = chemistryReportYearOf(
    result?.data?.[0]?.observation_datetime
  )

  const fetchYearObservations = useCallback(
    async (year: number) => {
      if (thingId == null) return []

      const params = { thing_id: thingId, ...chemistryReportYearParams(year) }
      const collected: ChemistryObservation[] = []
      let currentPage = 1

      while (true) {
        const page = await ocotilloDataProvider.getList({
          resource: CHEMISTRY_RESOURCE,
          pagination: { currentPage, pageSize: CHEMISTRY_REPORT_PAGE_SIZE },
          meta: { params },
        })

        collected.push(...(page.data as ChemistryObservation[]))

        if (page.data.length === 0 || collected.length >= page.total) break
        currentPage += 1
      }

      return sortChemistryObservations(collected)
    },
    [ocotilloDataProvider, thingId]
  )

  return {
    reportYear,
    hasChemistry: reportYear != null,
    isLoading: enabled && Boolean(thingId) ? query.isLoading : false,
    fetchYearObservations,
  }
}
