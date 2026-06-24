import { useEffect, useMemo, useRef } from 'react'
import { useDataProvider, useList, useResourceParams } from '@refinedev/core'
import { captureEvent } from '@/analytics/posthog'
import { useQuery } from '@tanstack/react-query'
import { Show, useDataGrid } from '@refinedev/mui'
import { PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditPanelLayout } from '@/components/editing'
import { WellEditPanel } from '@/components/WellEdit/WellEditPanel'
import { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import {
  IAsset,
  IContact,
  IFieldEvent,
  IFieldEventParticipant,
  IGroup,
  IWellDetails,
  IObservation,
  ISample,
  ISensor,
  IWellScreen,
} from '@/interfaces/ocotillo'
import { Box, Stack } from '@mui/material'
import { IHydrographDatasource } from '@/interfaces/st2'
import {
  useAccessCapabilities,
  useContainerMinWidth,
  useSensorDeploymentRows,
  useSidebarPanelSync,
  useWellDetails,
} from '@/hooks'
import { WELL_SHOW_TWO_COLUMN_MIN_PX } from '@/constants/breakpoints'
import {
  CoreWellInfoCard,
  InteractiveSatelliteMapCard,
  HydrographCard,
  RecentWaterLevelObservationsCard,
  ContactsCard,
  AttachmentsCard,
  AlternateIdsCard,
  USGSInfoCard,
  OSEPODInfoCard,
  WellPDFActionsButton,
  WellScreensCard,
  EquipmentCard,
  NotesAccordion,
  ConstructionInfoCard,
  GeologyInformationCard,
  WellShowTitle,
  OwnerPermissionsCard,
  MonitoringInfoCard,
  WaterLevelObservationRow,
} from '@/components'
import {
  ocotilloCardHeaderProps,
  OcotilloHeaderButtons,
} from '@/components/OcotilloPageHeader'
import { displayWellSiteName } from '@/utils'

const EMPTY_ASSETS: IAsset[] = []
const EMPTY_CONTACTS: IContact[] = []
const EMPTY_SENSORS: ISensor[] = []
const EMPTY_DEPLOYMENTS: IWellDetails['deployments'] = []
const EMPTY_WELL_SCREENS: IWellScreen[] = []
const EMPTY_FIELD_EVENTS: IFieldEvent[] = []
const EMPTY_PARTICIPANTS: IFieldEventParticipant[] = []
const EMPTY_MANUAL_HYDRO_ROWS: IObservation[] = []
const EMPTY_TRANSDUCER_HYDRO_ROWS: TransducerObservationWithBlockResponse[] = []
const EMPTY_GROUPS: IGroup[] = []

export const WellShow = () => {
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = useMemo(
    () => dataProvider('ocotillo'),
    [dataProvider]
  )

  const {
    isPanelOpen: isEditPanelOpen,
    closePanel: closeEditPanel,
    togglePanel: toggleEditPanel,
  } = useSidebarPanelSync()

  const { id } = useResourceParams()

  useEffect(() => {
    if (id)
      captureEvent('feature_used', {
        feature: 'well_detail',
        well_id: id,
        well_detail_area: 'ocotillo',
      })
  }, [id])

  const {
    query: detailsQuery,
    well,
    isLoading: isDetailsLoading,
  } = useWellDetails(id)
  const { canViewAmp, canEditWell } = useAccessCapabilities()

  const { result: assetResult, query: assetQuery } = useList<IAsset>({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: id } },
    queryOptions: {
      enabled: Boolean(id),
      // Signed URLs expire after 15 minutes. Refresh the asset list every
      // 10 minutes so preview and download links remain valid while the
      // user is viewing the page.
      refetchInterval: 10 * 60 * 1000,

      // Only refresh while the page is active to avoid unnecessary requests.
      refetchIntervalInBackground: false,

      // Treat asset data as fresh for 9 minutes. The periodic refetch updates
      // the signed URLs before they expire.
      staleTime: 9 * 60 * 1000,
    },
  })
  useEffect(() => {
    if (!well?.name) return
    const appTitle = import.meta.env.VITE_APP_TITLE || 'Ocotillo'
    const prev = document.title
    document.title = `${well.name} - Wells | ${appTitle}`
    return () => {
      document.title = prev
    }
  }, [well?.name])
  const assets = assetResult?.data ?? EMPTY_ASSETS
  const contacts = detailsQuery.data?.contacts ?? EMPTY_CONTACTS
  const sensors = detailsQuery.data?.sensors ?? EMPTY_SENSORS
  const deployments = detailsQuery.data?.deployments ?? EMPTY_DEPLOYMENTS
  const wellScreens = detailsQuery.data?.well_screens ?? EMPTY_WELL_SCREENS
  const fieldEvents = detailsQuery.data?.field_events ?? EMPTY_FIELD_EVENTS
  // first_field_event is the oldest field event, returned separately by the API
  // to avoid being cut off by the field_events page limit
  const firstVisitParticipants =
    detailsQuery.data?.first_field_event?.field_event_participants ??
    EMPTY_PARTICIPANTS

  const recentObservations = useMemo<
    Partial<WaterLevelObservationRow>[]
  >(() => {
    return fieldEvents
      .flatMap((event) =>
        (event.field_activities ?? []).flatMap((activity) =>
          (activity.samples ?? []).flatMap((sample) =>
            (sample.observations ?? []).map((observation) => ({
              ...observation,
              water_level_method: sample.sample_method,
              water_level_status: observation.groundwater_level_reason,
              water_level_measuring_staff: sample.contact?.name,
              water_level_notes:
                sample.notes ?? activity.notes ?? event.notes ?? null,
              water_level_data_quality: observation.nma_data_quality,
            }))
          )
        )
      )
      .filter((obs) => obs.observation_datetime != null)
      .sort((a, b) => {
        const dateA = new Date(a.observation_datetime!).getTime()
        const dateB = new Date(b.observation_datetime!).getTime()
        return dateB - dateA
      })
  }, [fieldEvents])

  const latestSample = useMemo(() => {
    const newestEvent = fieldEvents[0]
    if (!newestEvent) return undefined
    const firstActivity = newestEvent.field_activities?.[0]
    return firstActivity?.samples?.[0] ?? undefined
  }, [fieldEvents])

  const sensorDeployments = useSensorDeploymentRows({
    deployments,
    sensors,
  })

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
    queryKey: ['well-hydrograph', id ?? ''],
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async ({ queryKey, signal }) => {
      const thingId = queryKey[1]
      if (thingId === '' || thingId == null) {
        return {
          manualRows: [] as IObservation[],
          transducerRows: [] as TransducerObservationWithBlockResponse[],
        }
      }

      const listMeta = (params: Record<string, string | number>) => ({
        params,
        ...(signal ? { signal } : {}),
      })

      const fetchAllPages = async <TRow,>(
        resource: string,
        params: Record<string, string | number>,
        pageSize = 1000
      ) => {
        const firstPage = await ocotilloDataProvider.getList({
          resource,
          pagination: { currentPage: 1, pageSize },
          meta: listMeta(params),
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
              meta: listMeta(params),
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
          thing_id: thingId as string | number,
        }),
        fetchAllPages<TransducerObservationWithBlockResponse>(
          'observation/transducer-groundwater-level',
          {
            thing_id: thingId as string | number,
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

  const manualHydrographRows =
    hydrographQuery.data?.manualRows ?? EMPTY_MANUAL_HYDRO_ROWS
  const transducerHydrographRows =
    hydrographQuery.data?.transducerRows ?? EMPTY_TRANSDUCER_HYDRO_ROWS

  const hydrographDatasource = useMemo<IHydrographDatasource[]>(() => {
    const manualSource =
      manualHydrographRows.length > 0
        ? {
            id: 1,
            name: 'Groundwater Level',
            style: 'scatter',
            data: manualHydrographRows
              .filter(
                (obs) =>
                  obs.observation_datetime != null &&
                  obs.depth_to_water_bgs != null &&
                  !Number.isNaN(Number(obs.depth_to_water_bgs))
              )
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
              .filter(
                ({ observation }) =>
                  observation?.observation_datetime != null &&
                  observation?.value != null
              )
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

  const layoutRef = useRef<HTMLDivElement>(null)
  const isWideLayout = useContainerMinWidth(
    layoutRef,
    WELL_SHOW_TWO_COLUMN_MIN_PX
  )

  const wellShowCards = useMemo(() => {
    const mainCards = [
      <CoreWellInfoCard key="core" well={well} />,
      <InteractiveSatelliteMapCard key="map" variant="well" well={well} />,
      <HydrographCard
        key="hydrograph"
        well={well}
        rows={[...manualHydrographRows, ...transducerHydrographRows]}
        dataSource={hydrographDatasource}
        isLoading={hydrographQuery.isPending}
      />,
      <RecentWaterLevelObservationsCard
        key="observations"
        well={well}
        rows={recentObservations}
        isLoading={isDetailsLoading}
      />,
      <NotesAccordion key="notes" well={well} />,
      <EquipmentCard
        key="equipment"
        sensors={sensors}
        deployments={deployments}
        isDetailsPending={Boolean(id) && detailsQuery.isPending}
      />,
      <WellScreensCard
        key="screens"
        rows={wellScreens}
        isLoading={isDetailsLoading}
      />,
      <AlternateIdsCard key="ids" dataGridProps={idLinkDataGridProps} />,
      <AttachmentsCard
        key="attachments"
        assets={assets}
        isLoading={assetQuery.isLoading}
        refetchAssets={assetQuery.refetch}
        thingId={well?.id ?? (id ? Number(id) : null)}
      />,
      <OSEPODInfoCard key="osepod" pod_id={osepod_id} />,
      <USGSInfoCard key="usgs" site_id={usgs_id} />,
    ]

    const sideCards = [
      <ContactsCard
        key="contacts"
        contacts={contacts}
        isLoading={isDetailsLoading}
        siteName={well ? displayWellSiteName(well) : undefined}
      />,
      <MonitoringInfoCard
        key="monitoring"
        well={well}
        firstVisitParticipants={firstVisitParticipants}
        lastVisitDate={fieldEvents[0]?.event_date}
        isLoading={isDetailsLoading}
      />,
      <OwnerPermissionsCard
        key="owner"
        well={well}
        isLoading={isDetailsLoading}
      />,
      <ConstructionInfoCard key="construction" well={well} />,
      <GeologyInformationCard key="geology" well={well} />,
    ]

    const mobileCards = [
      mainCards[0],
      sideCards[0],
      sideCards[1],
      mainCards[1],
      mainCards[2],
      mainCards[3],
      sideCards[2],
      mainCards[4],
      mainCards[5],
      mainCards[6],
      mainCards[7],
      mainCards[8],
      mainCards[9],
      mainCards[10],
      sideCards[3],
      sideCards[4],
    ]

    return { mainCards, sideCards, mobileCards }
  }, [
    assetQuery.isLoading,
    assetQuery.refetch,
    assets,
    contacts,
    deployments,
    detailsQuery.isPending,
    fieldEvents,
    firstVisitParticipants,
    hydrographDatasource,
    hydrographQuery.isPending,
    id,
    idLinkDataGridProps,
    isDetailsLoading,
    manualHydrographRows,
    osepod_id,
    recentObservations,
    sensors,
    transducerHydrographRows,
    usgs_id,
    well,
    wellScreens,
  ])

  return (
    <EditPanelLayout
      open={isEditPanelOpen && Boolean(id)}
      pinPanel="sticky"
      panel={
        id ? (
          <WellEditPanel
            wellId={id}
            wellName={well?.name}
            assignedGroups={well?.groups ?? EMPTY_GROUPS}
            isAssignedGroupsLoading={
              detailsQuery.isLoading && !detailsQuery.data
            }
            onClose={closeEditPanel}
          />
        ) : null
      }
    >
      <Show
        goBack={false}
        breadcrumb={false}
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
        headerProps={ocotilloCardHeaderProps}
        contentProps={{ sx: { pt: 1 } }}
        headerButtons={() => (
          <OcotilloHeaderButtons>
            {canViewAmp ? (
              <WellPDFActionsButton
                isPreviewLoading={isDetailsLoading}
                isDownloadLoading={isPdfDataLoading}
                well={well}
                observations={recentObservations}
                assets={assets}
                contacts={contacts}
                sample={latestSample as Partial<ISample> | undefined}
                sensorDeployments={sensorDeployments}
              />
            ) : null}
            {canEditWell ? (
              <Button
                variant={isEditPanelOpen ? 'default' : 'outline'}
                size="sm"
                onClick={toggleEditPanel}
              >
                <PencilIcon />
                <span className="hidden mobile-lg:inline">Edit</span>
              </Button>
            ) : null}
          </OcotilloHeaderButtons>
        )}
      >
        <Box
          ref={layoutRef}
          sx={{
            width: '100%',
            minWidth: 0,
            containerType: 'inline-size',
          }}
        >
          {isWideLayout ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Stack spacing={2} sx={{ flex: '2 1 0', minWidth: 0 }}>
                {wellShowCards.mainCards}
              </Stack>
              <Stack
                spacing={2}
                sx={{ flex: '1 1 280px', minWidth: 0, maxWidth: 360 }}
              >
                {wellShowCards.sideCards}
              </Stack>
            </Box>
          ) : (
            <Stack spacing={2}>{wellShowCards.mobileCards}</Stack>
          )}
        </Box>
      </Show>
    </EditPanelLayout>
  )
}
