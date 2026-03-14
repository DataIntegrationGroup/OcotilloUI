import { useEffect, useMemo, useState } from 'react'
import { HttpError, useOne, useResourceParams, useShow } from '@refinedev/core'
import { Breadcrumb, ListButton, Show, useDataGrid } from '@refinedev/mui'
import { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import { ISample, IWell } from '@/interfaces/ocotillo'
import { Box, Stack, Typography } from '@mui/material'
import { IHydrographDatasource } from '@/interfaces/st2'
import Grid from '@mui/material/Grid2'
import {
  CoreWellInfoCard,
  InteractiveSatelliteMapCard,
  HydrographCard,
  RecentWaterLevelObservationsCard,
  ContactsAccordion,
  AttachmentsAccordion,
  AlternateIdsAccordion,
  USGSInfoCard,
  OSEPODInfoCard,
  WellPDFPreviewButton,
  WellScreensAccordion,
  EquipmentAccordion,
  NotesAccordion,
  AdditionalWellInformationAccordion,
  FieldEventHistoryAccordion,
  WellPDFDownloadButton,
} from '@/components'

export const WellShow = () => {
  const { query, result: well } = useShow<IWell, HttpError>()

  const [hydrographDatasource, setHydrographDatasource] = useState<
    IHydrographDatasource[]
  >([])
  const { id } = useResourceParams()

  const {
    dataGridProps: { rows: observations, loading: observationsIsloading },
  } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })
  const {
    dataGridProps: {
      rows: transducerObservationRows,
      loading: transducerObservationsIsLoading,
    },
  } = useDataGrid<TransducerObservationWithBlockResponse>({
    resource: 'observation/transducer-groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const sampleId = useMemo(() => {
    return (
      observations
        ?.filter((o) => o.observation_datetime)
        .sort(
          (a, b) =>
            new Date(b.observation_datetime!).getTime() -
            new Date(a.observation_datetime!).getTime()
        )[0]?.sample_id ?? null
    )
  }, [observations])

  const hasSampleId = sampleId != null

  const { result: sampleData } = useOne<ISample>({
    resource: 'ocotillo.sample',
    id: sampleId,
    queryOptions: {
      enabled: hasSampleId,
    },
  })

  const sample = sampleData

  const { dataGridProps: idLinkDataGridProps } = useDataGrid({
    resource: `thing/${id}/id-link`,
    dataProviderName: 'ocotillo',
    queryOptions: {
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { rows: idLinks, loading: idLinksIsloading } = idLinkDataGridProps
  const usgs_id =
    idLinks?.find((link: any) => link.alternate_organization === 'USGS')
      ?.alternate_id || 'N/A'
  const osepod_id =
    idLinks?.find(
      (link: any) =>
        link.alternate_organization === 'NMOSE' && link.relation === 'OSEPOD'
    )?.alternate_id || 'N/A'

  useEffect(() => {
    if (!idLinks || idLinks.length === 0) return
    if (idLinksIsloading) return
  }, [idLinks, idLinksIsloading])

  useEffect(() => {
    const manualSource =
      observations.length > 0
        ? {
            id: 1,
            name: 'Groundwater Level',
            style: 'scatter',
            data: observations.map((obs) => ({
              phenomenonTime: new Date(obs.observation_datetime),
              result: Number(obs.depth_to_water_bgs),
            })),
          }
        : null

    const transducerSource =
      transducerObservationRows.length > 0
        ? {
            id: 2,
            name: 'Transducer Groundwater Level',
            style: 'line',
            data: transducerObservationRows.map(({ observation }) => ({
              phenomenonTime: new Date(observation.observation_datetime),
              result: Number(observation.value),
            })),
          }
        : null

    const source: IHydrographDatasource[] = [
      ...(manualSource ? [manualSource] : []),
      ...(transducerSource ? [transducerSource] : []),
    ]

    setHydrographDatasource(source)
  }, [observations, transducerObservationRows])

  return (
    <Show
      isLoading={query.isLoading}
      breadcrumb={<Breadcrumb hideIcons={true} />}
      title={
        <Typography variant="h5">{`Show Well${well?.name ? `: ${well?.name}` : ''}`}</Typography>
      }
      headerButtons={() => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ListButton />
          <WellPDFPreviewButton isLoading={query.isLoading} />
          <WellPDFDownloadButton well={well} isLoading={query.isLoading} />
        </Box>
      )}
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CoreWellInfoCard
              well={well}
              usgs_id={usgs_id}
              osepod_id={osepod_id}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <InteractiveSatelliteMapCard well={well} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <HydrographCard
              well={well}
              rows={[...observations, ...transducerObservationRows]}
              dataSource={hydrographDatasource}
              isLoading={
                observationsIsloading || transducerObservationsIsLoading
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <RecentWaterLevelObservationsCard
              well={well}
              rows={observations}
              isLoading={observationsIsloading}
            />
          </Grid>
        </Grid>
        <Box component="div">
          <AdditionalWellInformationAccordion well={well} />
          <NotesAccordion well={well} />
          <ContactsAccordion id={well?.id} />
          <EquipmentAccordion id={well?.id} />
          <WellScreensAccordion id={well?.id} />
          <AlternateIdsAccordion dataGridProps={idLinkDataGridProps} />
          <FieldEventHistoryAccordion sample={sample} />
          <AttachmentsAccordion id={well?.id} />
        </Box>
        <OSEPODInfoCard pod_id={osepod_id} />
        <USGSInfoCard site_id={usgs_id} />
      </Stack>
    </Show>
  )
}
