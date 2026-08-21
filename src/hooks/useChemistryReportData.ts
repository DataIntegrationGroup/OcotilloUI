import { useList, useOne } from '@refinedev/core'
import { useMemo } from 'react'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  CHEMISTRY_REPORT_PAGE_SIZE,
  chemistryReportYearParams,
  sortChemistryResults,
} from '@/utils/chemistryReport'

/** Which legacy chemistry table a result came from. */
export type ChemistryResultKind =
  | 'major'
  | 'minor'
  | 'radionuclide'
  | 'field'
  | 'unknown'

/**
 * One analyte result from `chemistry/results`. Hand-written rather than taken
 * from `types.gen`: the generated types cover the refactored
 * `observation/water-chemistry` endpoint, which holds no water chemistry, and
 * this response is flat -- the parameter name is on the row instead of in a
 * nested parameter record.
 */
export type ChemistryResult = {
  id: string
  thing_id: number
  station_name?: string | null
  sample_id?: number | null
  parameter_name: string
  value: number | null
  unit: string | null
  observation_datetime: string
  result_kind: ChemistryResultKind
}

/**
 * Everything the chemistry report needs for one well and one reporting
 * period. Chemistry comes from the legacy NMA tables via `chemistry/results`;
 * the refactored observation endpoint holds none. The period is inclusive of Jan 1 and exclusive of Jan 1 of the
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
    useList<ChemistryResult>({
      resource: 'chemistry/results',
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
    () => sortChemistryResults(observationResult?.data ?? []),
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
