import { useEffect, useMemo, useState } from 'react'
import { HttpError, useOne, useResourceParams, useShow } from '@refinedev/core'
import { Show, useDataGrid } from '@refinedev/mui'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import { ISample, IWell } from '@/interfaces/ocotillo'
import { Box, Stack, Typography } from '@mui/material'
import { IHydrographDatasource } from '@/interfaces/st2'
import { useWellPdfData } from '@/hooks'
import Grid from '@mui/material/Grid2'
import {
  CoreWellInfoCard,
  InteractiveSatelliteMapCard,
  WellStatusChips,
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
  ConstructionInfoAccordion,
  GeologyInformationAccordion,
  OwnerPermissionsAccordion,
  WellPhysicalPropertiesAccordion,
  FieldEventHistoryAccordion,
  WellPDFDownloadButton,
} from '@/components'

export const WellShow = () => {
  const { query, result: well } = useShow<IWell, HttpError>()
  const { id } = useResourceParams()
  const {
    observations: pdfObservations,
    assets,
    contacts,
    sample,
    sensorDeployments,
    isLoading: isPdfDataLoading,
  } = useWellPdfData({
    thingId: id,
    well,
  })

  const [hydrographDatasource, setHydrographDatasource] = useState<
    IHydrographDatasource[]
  >([])

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

  const fieldEventSample = sampleData

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
      goBack={false}
      breadcrumb={<AppBreadcrumb />}
      wrapperProps={{
        elevation: 0,
        sx: {
          bgcolor: 'background.wrapper',
          boxShadow: 'none',
          borderRadius: 1,
          padding: 0,
        },
      }}
      title={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="h3" fontWeight={700}>
            {well?.name ?? ''}
          </Typography>
          <WellStatusChips well={well} />
        </Box>
      }
      headerProps={{
        sx: {
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          '.MuiCardHeader-action': {
            alignSelf: { xs: 'flex-end', md: 'flex-start' },
            mt: { xs: 1, md: 0.5 },
            mr: 0,
          },
        },
      }}
      contentProps={{ sx: { pt: 1 } }}
      headerButtons={() => (
        <Box sx={{ display: 'flex', gap: 0 }}>
          <WellPDFPreviewButton isLoading={query.isLoading} />
          <WellPDFDownloadButton
            well={well}
            isLoading={query.isLoading || isPdfDataLoading}
            observations={pdfObservations}
            assets={assets}
            contacts={contacts}
            sample={sample}
            sensorDeployments={sensorDeployments}
          />
        </Box>
      )}
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          {/* Left column: 8 cols */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Stack spacing={2}>
              <CoreWellInfoCard
                well={well}
                usgs_id={usgs_id}
                osepod_id={osepod_id}
              />
              <InteractiveSatelliteMapCard well={well} />
              <HydrographCard
                well={well}
                rows={[...observations, ...transducerObservationRows]}
                dataSource={hydrographDatasource}
                isLoading={
                  observationsIsloading || transducerObservationsIsLoading
                }
              />
              <RecentWaterLevelObservationsCard
                well={well}
                rows={observations}
                isLoading={observationsIsloading}
              />
              <NotesAccordion well={well} />
              <EquipmentAccordion id={well?.id} />
              <WellScreensAccordion id={well?.id} />
              <AlternateIdsAccordion dataGridProps={idLinkDataGridProps} />
              <AttachmentsAccordion id={well?.id} />
              <OSEPODInfoCard pod_id={osepod_id} />
              <USGSInfoCard site_id={usgs_id} />
            </Stack>
          </Grid>

          {/* Right column: 2 cols */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <Stack spacing={2}>
              <ContactsAccordion id={well?.id} />
              <OwnerPermissionsAccordion well={well} />
              <ConstructionInfoAccordion well={well} />
              <WellPhysicalPropertiesAccordion well={well} />
              <GeologyInformationAccordion well={well} />
              <FieldEventHistoryAccordion sample={fieldEventSample} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Show>
  )
}
