import { useEffect, useMemo } from 'react'
import { useDataProvider, useList, useResourceParams } from '@refinedev/core'
import { captureEvent } from '@/analytics/posthog'
import { useQuery } from '@tanstack/react-query'
import { Show, useDataGrid } from '@refinedev/mui'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import { IAsset, IWellDetails, IObservation, ISample } from '@/interfaces/ocotillo'
import { Box, Stack } from '@mui/material'
import { IHydrographDatasource } from '@/interfaces/st2'
import { useAccessCapabilities, useSensorDeploymentRows } from '@/hooks'
import Grid from '@mui/material/Grid2'
import {
  CoreWellInfoCard,
  InteractiveSatelliteMapCard,
  HydrographCard,
  RecentWaterLevelObservationsCard,
  ContactsCard,
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
  WellPhysicalPropertiesAccordion,
  WellPDFDownloadButton,
  WellShowTitle,
  OwnerPermissionsCard,
} from '@/components'

export const WellShow = () => {
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = useMemo(
    () => dataProvider('ocotillo'),
    [dataProvider]
  )

  const { id } = useResourceParams()

  useEffect(() => {
    if (id)
      captureEvent('feature_used', { feature: 'well_detail', well_id: id })
  }, [id])

  const detailsQuery = useQuery({
    queryKey: ['well-details', id],
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await ocotilloDataProvider.custom({
        url: `thing/water-well/${id}/details`,
        method: 'get',
      })

      return response.data as IWellDetails
    },
  })
  const { canManageAmp } = useAccessCapabilities()

  const { result: assetResult, query: assetQuery } = useList<IAsset>({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: id } },
    queryOptions: {
      enabled: Boolean(id),
    },
  })
  const well = detailsQuery.data?.well

  useEffect(() => {
    if (!well?.name) return
    const appTitle = import.meta.env.VITE_APP_TITLE || 'Ocotillo'
    const prev = document.title
    document.title = `${well.name} - Wells | ${appTitle}`
    return () => {
      document.title = prev
    }
  }, [well?.name])
  const observations =
    detailsQuery.data?.recent_groundwater_level_observations ?? []
  const assets = assetResult?.data ?? []
  const contacts = detailsQuery.data?.contacts ?? []
  const sensors = detailsQuery.data?.sensors ?? []
  const deployments = detailsQuery.data?.deployments ?? []
  const wellScreens = detailsQuery.data?.well_screens ?? []
  const fieldEventSample = detailsQuery.data?.latest_field_event_sample ?? null

  const sensorDeployments = useSensorDeploymentRows({
    deployments,
    sensors,
  })

  const isDetailsLoading = detailsQuery.isLoading
  const isPdfDataLoading = isDetailsLoading || assetQuery.isLoading

  const { dataGridProps: idLinkDataGridProps } = useDataGrid({
    resource: `thing/${id}/id-link`,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: Boolean(id),
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { rows: idLinks } = idLinkDataGridProps
  const usgs_id =
    idLinks?.find((link: any) => link.alternate_organization === 'USGS')
      ?.alternate_id || 'N/A'
  const osepod_id =
    idLinks?.find(
      (link: any) =>
        link.alternate_organization === 'NMOSE' && link.relation === 'OSEPOD'
    )?.alternate_id || 'N/A'

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
      title={<WellShowTitle well={well} isLoading={isDetailsLoading} />}
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
            <WellPDFPreviewButton isLoading={isDetailsLoading} />
            <WellPDFDownloadButton
              well={well}
              isLoading={isPdfDataLoading}
              observations={observations}
              assets={assets}
              contacts={contacts}
              sample={fieldEventSample}
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
                isLoading={isDetailsLoading}
              />
              <NotesAccordion well={well} />
              <EquipmentAccordion
                sensors={sensors}
                deployments={deployments}
                isLoading={isDetailsLoading}
              />
              <WellScreensAccordion
                rows={wellScreens}
                isLoading={isDetailsLoading}
              />
              <AlternateIdsAccordion dataGridProps={idLinkDataGridProps} />
              <AttachmentsAccordion
                assets={assets}
                isLoading={assetQuery.isLoading}
              />
              <OSEPODInfoCard pod_id={osepod_id} />
              <USGSInfoCard site_id={usgs_id} />
            </Stack>
          </Grid>

          {/* Right column: 2 cols */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <Stack spacing={2}>
              <ContactsCard contacts={contacts} isLoading={isDetailsLoading} siteName={well?.site_name} />
              <OwnerPermissionsCard well={well} isLoading={isDetailsLoading} />
              <ConstructionInfoAccordion well={well} />
              <WellPhysicalPropertiesAccordion well={well} />
              <GeologyInformationAccordion well={well} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Show>
  )
}
