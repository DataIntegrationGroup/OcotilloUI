import { useMemo } from 'react'
import { useList, useOne } from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import { IContact, ISample, ISensor, IWell } from '@/interfaces/ocotillo'
import { useSensorDeploymentRows } from './useSensorDeploymentRows'
import { SensorDeploymentRow } from '@/utils'

type WellPdfThingId = string | number | undefined

export const useWellPdfData = ({
  thingId,
  well: initialWell,
}: {
  thingId: WellPdfThingId
  well?: IWell
}) => {
  const { result: fetchedWell, query: wellQuery } = useOne<IWell>({
    resource: 'thing-well',
    id: thingId,
    queryOptions: {
      enabled: Boolean(thingId && !initialWell),
    },
  })

  const well = initialWell ?? fetchedWell

  const { dataGridProps: sensorDataGridProps } = useDataGrid<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: thingId,
      },
    },
    queryOptions: {
      enabled: Boolean(thingId),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const { dataGridProps: deploymentsDataGridProps } = useDataGrid({
    resource: thingId ? `thing/${thingId}/deployment` : undefined,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: Boolean(thingId),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const {
    dataGridProps: { rows: observations, loading: observationsIsLoading },
  } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: { thing_id: thingId },
    },
    queryOptions: {
      enabled: Boolean(thingId),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const { result: assetData, query: assetQuery } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: thingId } },
    queryOptions: {
      enabled: Boolean(thingId),
    },
  })

  const { result: contactData, query: contactQuery } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: thingId } },
    queryOptions: {
      enabled: Boolean(thingId),
    },
  })

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

  const { result: sample, query: sampleQuery } = useOne<ISample>({
    resource: 'ocotillo.sample',
    id: sampleId,
    queryOptions: {
      enabled: hasSampleId,
    },
  })

  const sensors = sensorDataGridProps?.rows ?? []
  const deployments = deploymentsDataGridProps?.rows ?? []
  const assets = assetData?.data ?? []
  const contacts = contactData?.data ?? []

  const sensorDeployments: SensorDeploymentRow[] = useSensorDeploymentRows({
    deployments,
    sensors,
  })

  const isLoading =
    wellQuery.isLoading ||
    observationsIsLoading ||
    assetQuery.isLoading ||
    contactQuery.isLoading ||
    (hasSampleId && sampleQuery.isLoading)

  let progress: number = 0

  if (thingId) {
    const steps: { weight: number; done: boolean }[] = [
      { weight: 15, done: initialWell ? true : !wellQuery.isLoading },
      { weight: 30, done: !observationsIsLoading },
      { weight: 15, done: !assetQuery.isLoading },
      { weight: 15, done: !contactQuery.isLoading },
      { weight: 10, done: sensors.length > 0 || !sensorDataGridProps?.loading },
      {
        weight: 10,
        done: deployments.length > 0 || !deploymentsDataGridProps?.loading,
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
