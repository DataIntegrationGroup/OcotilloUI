import { useDataProvider, useList, useOne } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  fetchChemistryYear,
  fetchContinuousWaterLevels,
  fetchReportWaterLevels,
} from './chemistryReportFetchers'

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
  /** When the water was collected; every result in a sample shares it. */
  observation_datetime: string
  /** When the lab ran the result. Null for field parameters. */
  analysis_date?: string | null
  result_kind: ChemistryResultKind
}

const REPORT_STALE_TIME = 5 * 60 * 1000

/**
 * Everything the chemistry report needs for one well and one reporting
 * period. The chemistry and water levels come through the same fetchers the
 * well details page uses, so a report reads the same wherever it is made.
 */
export const useChemistryReportData = ({
  thingId,
  year,
}: {
  thingId: string | number | undefined
  year: number
}) => {
  const enabled = Boolean(thingId)
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = useMemo(
    () => dataProvider('ocotillo'),
    [dataProvider]
  )

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

  const elevationFt = (
    (well as IWell | undefined)?.current_location?.properties as
      | { elevation?: number | null }
      | undefined
  )?.elevation

  const observationQuery = useQuery({
    queryKey: ['chemistry-report', 'chemistry', thingId, year],
    queryFn: () =>
      fetchChemistryYear(
        ocotilloDataProvider,
        thingId as string | number,
        year
      ),
    enabled,
    staleTime: REPORT_STALE_TIME,
  })

  // Waits on the well so the elevation is known before the readings are
  // turned into water table elevations.
  const waterLevelQuery = useQuery({
    queryKey: ['chemistry-report', 'water-levels', thingId, year, elevationFt],
    queryFn: () =>
      fetchReportWaterLevels(
        ocotilloDataProvider,
        thingId as string | number,
        year,
        { elevationFt }
      ),
    enabled: enabled && !wellQuery.isLoading,
    staleTime: REPORT_STALE_TIME,
  })

  const continuousQuery = useQuery({
    queryKey: ['chemistry-report', 'continuous', thingId, year],
    queryFn: () =>
      fetchContinuousWaterLevels(
        ocotilloDataProvider,
        thingId as string | number,
        year
      ),
    enabled,
    staleTime: REPORT_STALE_TIME,
  })

  const isLoading =
    wellQuery.isLoading ||
    contactQuery.isLoading ||
    observationQuery.isLoading ||
    waterLevelQuery.isLoading ||
    continuousQuery.isLoading

  return {
    well: well as IWell | undefined,
    contacts: contactResult?.data ?? [],
    observations: observationQuery.data ?? [],
    waterLevels: waterLevelQuery.data ?? [],
    continuous: continuousQuery.data ?? null,
    isLoading: enabled ? isLoading : false,
    isError:
      wellQuery.isError ||
      contactQuery.isError ||
      observationQuery.isError ||
      waterLevelQuery.isError ||
      continuousQuery.isError,
  }
}
