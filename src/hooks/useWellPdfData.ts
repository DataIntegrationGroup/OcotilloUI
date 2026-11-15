import { useMemo } from 'react'
import { useList, useOne } from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import { IAsset, IContact, ISample, IWell } from '@/interfaces/ocotillo'
import { useSensorDeploymentRows } from './useSensorDeploymentRows'
import { useWellDetails } from './useWellDetails'
import { SensorDeploymentRow } from '@/utils'

type WellPdfThingId = string | number | undefined

export const useWellPdfData = ({
  thingId,
  well: initialWell,
  observations: initialObservations,
  assets: initialAssets,
  contacts: initialContacts,
  sensorDeployments: initialSensorDeployments,
  sample: initialSample,
}: {
  thingId: WellPdfThingId
  well?: IWell
  observations?: readonly any[]
  assets?: readonly IAsset[]
  contacts?: readonly IContact[]
  sensorDeployments?: readonly SensorDeploymentRow[]
  sample?: ISample
}) => {
  // One call: GET thing/water-well/{id}/details carries the well plus its
  // contacts, sensors, deployments, well screens and field events.
  const {
    well: detailsWell,
    data: details,
    query: wellDetailsQuery,
  } = useWellDetails(thingId)

  const well = initialWell ?? detailsWell

  const { dataGridProps: observationsDataGridProps } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: { thing_id: thingId },
    },
    queryOptions: {
      enabled: Boolean(thingId && !initialObservations),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const observations =
    (initialObservations as any[]) ??
    (observationsDataGridProps?.rows as any[]) ??
    []

  const { result: fetchedAssets, query: assetQuery } = useList<IAsset>({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: thingId } },
    queryOptions: {
      enabled: Boolean(thingId && !initialAssets),
    },
  })

  const fetchedContacts = details?.contacts ?? []
  const fetchedSensors = details?.sensors ?? []
  const fetchedDeployments = details?.deployments ?? []

  const sampleId = useMemo(() => {
    return (
      observations
        ?.filter((observation) => observation.observation_datetime)
        .sort(
          (a, b) =>
            new Date(b.observation_datetime!).getTime() -
            new Date(a.observation_datetime!).getTime()
        )[0]?.sample_id ?? null
    )
  }, [observations])

  const hasSampleId = sampleId != null

  const { result: fetchedSample, query: sampleQuery } = useOne<ISample>({
    resource: 'ocotillo.sample',
    id: sampleId,
    queryOptions: {
      enabled: Boolean(hasSampleId && !initialSample),
    },
  })

  const sample = initialSample ?? fetchedSample

  const fetchedSensorDeployments = useSensorDeploymentRows({
    deployments: fetchedDeployments,
    sensors: fetchedSensors,
  })

  const sensorDeployments =
    (initialSensorDeployments as SensorDeploymentRow[]) ??
    fetchedSensorDeployments

  const assets = (initialAssets as IAsset[]) ?? fetchedAssets?.data ?? []
  const contacts = (initialContacts as IContact[]) ?? fetchedContacts

  const isLoading =
    wellDetailsQuery.isLoading ||
    observationsDataGridProps.loading ||
    assetQuery.isLoading ||
    (hasSampleId && sampleQuery.isLoading)

  let progress: number = 0

  if (thingId) {
    const steps: { weight: number; done: boolean }[] = [
      { weight: 40, done: initialWell ? true : !wellDetailsQuery.isLoading },
      { weight: 35, done: !observationsDataGridProps.loading },
      { weight: 20, done: initialAssets ? true : !assetQuery.isLoading },
      { weight: 5, done: !hasSampleId || !sampleQuery.isLoading },
    ]

    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0)
    const completedWeight = steps.reduce(
      (sum, step) => sum + (step.done ? step.weight : 0),
      0
    )

    progress = Math.round((completedWeight / totalWeight) * 100)
  }

  return {
    well,
    observations,
    assets,
    contacts,
    sample,
    sensorDeployments,
    wellScreens: details?.well_screens ?? [],
    fieldEvents: details?.field_events ?? [],
    firstFieldEvent: details?.first_field_event ?? null,
    isLoading,
    progress,
  }
}
