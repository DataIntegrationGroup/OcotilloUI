import { useEffect, useMemo } from 'react'
import {
  HttpError,
  useDataProvider,
  useOne,
  useResourceParams,
  useShow,
} from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { Show, useDataGrid } from '@refinedev/mui'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import { IObservation, ISample, IWell } from '@/interfaces/ocotillo'
import { Box, Stack } from '@mui/material'
import { IHydrographDatasource } from '@/interfaces/st2'
import { useAccessCapabilities, useWellPdfData } from '@/hooks'
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
  ConstructionInfoAccordion,
  GeologyInformationAccordion,
  OwnerPermissionsAccordion,
  WellPhysicalPropertiesAccordion,
  FieldEventHistoryAccordion,
  WellPDFDownloadButton,
  WellShowTitle,
} from '@/components'

export const WellShow = () => {
  const { query, result: well } = useShow<IWell, HttpError>()

  const dataProvider = useDataProvider()
  const ocotilloDataProvider = useMemo(
    () => dataProvider('ocotillo'),
    [dataProvider]
  )

  const { id } = useResourceParams()
  const { canManageAmp } = useAccessCapabilities()
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

  const hydrographQuery = useQuery({
    queryKey: ['well-hydrograph', id],
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const fetchAllPages = async <TRow,>(
        resource: string,
        params: Record<string, string | number>,
        pageSize = 1000
      ) => {
        const firstPage = await ocotilloDataProvider.getList({
          resource,
          pagination: { currentPage: 1, pageSize },
          meta: { params },
        })

        const totalPages = Math.max(1, Math.ceil(firstPage.total / pageSize))

        if (totalPages === 1) {
          return firstPage.data as TRow[]
        }

        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            ocotilloDataProvider.getList({
              resource,
              pagination: { currentPage: index + 2, pageSize },
              meta: { params },
            })
          )
        )

        return [
          ...(firstPage.data as TRow[]),
          ...remainingPages.flatMap((page) => page.data as TRow[]),
        ]
      }

      const [manualRows, transducerRows] = await Promise.all([
        fetchAllPages<IObservation>('observation/groundwater-level', {
          thing_id: id,
        }),
        fetchAllPages<TransducerObservationWithBlockResponse>(
          'observation/transducer-groundwater-level',
          {
            thing_id: id,
          },
          5000
        ),
      ])

      return {
        manualRows,
        transducerRows,
      }
    },
  })

  const manualHydrographRows = hydrographQuery.data?.manualRows ?? []
  const transducerHydrographRows = hydrographQuery.data?.transducerRows ?? []

  const hydrographDatasource = useMemo<IHydrographDatasource[]>(() => {
    const manualSource =
      manualHydrographRows.length > 0
        ? {
            id: 1,
            name: 'Groundwater Level',
            style: 'scatter',
            data: manualHydrographRows
              .filter((obs) => obs.observation_datetime)
              .map((obs) => ({
                phenomenonTime: new Date(obs.observation_datetime),
                result: Number(obs.depth_to_water_bgs),
              }))
              .sort(
                (a, b) =>
                  a.phenomenonTime.getTime() - b.phenomenonTime.getTime()
              ),
          }
        : null

    const transducerSource =
      transducerHydrographRows.length > 0
        ? {
            id: 2,
            name: 'Transducer Groundwater Level',
            style: 'line',
            data: transducerHydrographRows
              .filter(({ observation }) => observation?.observation_datetime)
              .map(({ observation }) => ({
                phenomenonTime: new Date(observation.observation_datetime),
                result: Number(observation.value),
              }))
              .sort(
                (a, b) =>
                  a.phenomenonTime.getTime() - b.phenomenonTime.getTime()
              ),
          }
        : null

    const source: IHydrographDatasource[] = [
      ...(manualSource ? [manualSource] : []),
      ...(transducerSource ? [transducerSource] : []),
    ]

    return source
  }, [manualHydrographRows, transducerHydrographRows])

  return (
    <Show
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
      title={<WellShowTitle well={well} isLoading={query.isLoading} />}
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
      headerButtons={() =>
        canManageAmp ? (
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
        ) : null
      }
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          {/* Left column: 8 cols */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Stack spacing={2}>
              <CoreWellInfoCard well={well} />
              <InteractiveSatelliteMapCard well={well} />
              <HydrographCard
                well={well}
                rows={[...manualHydrographRows, ...transducerHydrographRows]}
                dataSource={hydrographDatasource}
                isLoading={hydrographQuery.isLoading}
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
