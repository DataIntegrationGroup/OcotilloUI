import { useMemo } from 'react'
import { useList, useOne } from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import {
  IAsset,
  IContact,
  ISample,
  ISensor,
  IWell,
} from '@/interfaces/ocotillo'
import { useSensorDeploymentRows } from './useSensorDeploymentRows'
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
  const { result: fetchedWell, query: wellQuery } = useOne<IWell>({
    resource: 'thing-well',
    id: thingId,
    queryOptions: {
      enabled: Boolean(thingId && !initialWell),
    },
  })

  const well = initialWell ?? fetchedWell

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

  const { result: fetchedContacts, query: contactQuery } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: thingId } },
    queryOptions: {
      enabled: Boolean(thingId && !initialContacts),
    },
  })

  const { dataGridProps: sensorDataGridProps } = useDataGrid<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: thingId,
      },
    },
    queryOptions: {
      enabled: Boolean(thingId && !initialSensorDeployments),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const { dataGridProps: deploymentsDataGridProps } = useDataGrid({
    resource: thingId ? `thing/${thingId}/deployment` : undefined,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: Boolean(thingId && !initialSensorDeployments),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const fetchedSensors = sensorDataGridProps?.rows ?? []
  const fetchedDeployments = deploymentsDataGridProps?.rows ?? []

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
  const contacts =
    (initialContacts as IContact[]) ?? fetchedContacts?.data ?? []

  const isLoading =
    wellQuery.isLoading ||
    observationsDataGridProps.loading ||
    assetQuery.isLoading ||
    contactQuery.isLoading ||
    (!initialSensorDeployments &&
      (sensorDataGridProps.loading || deploymentsDataGridProps.loading)) ||
    (hasSampleId && sampleQuery.isLoading)

  let progress: number = 0

  if (thingId) {
    const steps: { weight: number; done: boolean }[] = [
      { weight: 15, done: initialWell ? true : !wellQuery.isLoading },
      { weight: 30, done: !observationsDataGridProps.loading },
      { weight: 15, done: initialAssets ? true : !assetQuery.isLoading },
      { weight: 15, done: initialContacts ? true : !contactQuery.isLoading },
      {
        weight: 10,
        done: initialSensorDeployments ? true : !sensorDataGridProps.loading,
      },
      {
        weight: 10,
        done: initialSensorDeployments
          ? true
          : !deploymentsDataGridProps.loading,
      },
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
    isLoading,
    progress,
  }
}
