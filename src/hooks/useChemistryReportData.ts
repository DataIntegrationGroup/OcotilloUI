import { useList, useOne } from '@refinedev/core'
import { useMemo } from 'react'
import type { WaterChemistryObservationResponse } from '@/generated/types.gen'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  CHEMISTRY_REPORT_PAGE_SIZE,
  chemistryReportYearParams,
  sortChemistryObservations,
} from '@/utils/chemistryReport'

export type ChemistryObservation = WaterChemistryObservationResponse

/**
 * Everything the chemistry report needs for one well and one reporting
 * period. The period is inclusive of Jan 1 and exclusive of Jan 1 of the
 * following year, which is how the API's start_time/end_time filter behaves.
 */
export const useChemistryReportData = ({
  thingId,
  year,
}: {
  thingId: string | number | undefined
  year: number
}) => {
  const enabled = Boolean(thingId)

  const { result: well, query: wellQuery } = useOne<IWell>({
    resource: 'thing-well',
    id: thingId,
    queryOptions: { enabled },
  })

  const { result: contactResult, query: contactQuery } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: thingId } },
    queryOptions: { enabled },
  })

  const { result: observationResult, query: observationQuery } =
    useList<ChemistryObservation>({
      resource: 'observation/water-chemistry',
      dataProviderName: 'ocotillo',
      pagination: {
        currentPage: 1,
        pageSize: CHEMISTRY_REPORT_PAGE_SIZE,
        mode: 'server',
      },
      meta: {
        params: {
          thing_id: thingId,
          ...chemistryReportYearParams(year),
        },
      },
      queryOptions: { enabled },
    })

  const observations = useMemo(
    () => sortChemistryObservations(observationResult?.data ?? []),
    [observationResult?.data]
  )

  const isLoading =
    wellQuery.isLoading || contactQuery.isLoading || observationQuery.isLoading

  return {
    well: well as IWell | undefined,
    contacts: contactResult?.data ?? [],
    observations,
    isLoading: enabled ? isLoading : false,
    isError:
      wellQuery.isError || contactQuery.isError || observationQuery.isError,
  }
}
