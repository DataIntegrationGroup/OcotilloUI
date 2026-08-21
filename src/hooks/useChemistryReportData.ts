import { useList, useOne } from '@refinedev/core'
import { useMemo } from 'react'
import type { WaterChemistryObservationResponse } from '@/generated/types.gen'
import type { IContact, IWell } from '@/interfaces/ocotillo'

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
      pagination: { currentPage: 1, pageSize: 500, mode: 'server' },
      meta: {
        params: {
          thing_id: thingId,
          start_time: `${year}-01-01T00:00:00`,
          end_time: `${year + 1}-01-01T00:00:00`,
        },
      },
      queryOptions: { enabled },
    })

  const observations = useMemo(
    () =>
      [...(observationResult?.data ?? [])].sort((a, b) => {
        const byDate =
          new Date(a.observation_datetime).getTime() -
          new Date(b.observation_datetime).getTime()
        if (byDate !== 0) return byDate
        return (a.parameter?.parameter_name ?? '').localeCompare(
          b.parameter?.parameter_name ?? ''
        )
      }),
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
