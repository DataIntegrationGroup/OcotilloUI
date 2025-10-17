import { HttpError, useList, useResourceParams, useShow } from '@refinedev/core'
import { Breadcrumb, CreateButton, Show, useDataGrid } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IWell } from '@/interfaces/ocotillo/IThing'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardContent,
  CardHeader,
  ImageList,
  ImageListItem,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { IHydrographDatasource } from '@/interfaces/st2/IHydrographDatasource'
import { Box } from '@mui/system'
import Grid from '@mui/material/Grid2'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { ISensor } from '@/interfaces/ocotillo/ISensor'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SettingsInputAntenna from '@mui/icons-material/SettingsInputAntenna'
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined'
import Image from '@mui/icons-material/Image'
import InfoIcon from '@mui/icons-material/Info'
import { settings } from '@/settings'
import { sensorDefaultColumns } from '@/pages/ocotillo/sensor'
import { actionColumnDef } from '@/components/CommonColumnDefs'
import {
  CoreWellInfoCard,
  InteractiveSatelliteMapCard,
  HydrographCard,
  RecentWaterLevelObservationsCard,
  ContactsAccordion,
} from '@/components'

export const WellShow = () => {
  const {
    queryResult: { data, isLoading },
  } = useShow<IWell, HttpError>()

  const well = data?.data

  // Custom configs for wells
  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  const [hydrographDatasource, setHydrographDatasource] = useState<
    IHydrographDatasource[]
  >([])
  const [assets, setAssets] = useState([])
  const { id } = useResourceParams()

  const { data: assetsData } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
  })

  useEffect(() => {
    if (!assetsData || !assetsData.data || assetsData.total === 0) return
    setAssets(assetsData.data)
  }, [assetsData])

  const { dataGridProps: wellScreenDataGridProps } = useDataGrid({
    resource: 'thing/well-screen',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
  })

  const wellScreenColumns: GridColDef[] = useMemo(() => {
    return [
      { field: 'screen_type', headerName: 'Screen Type', minWidth: 150 },
      {
        field: 'screen_depth_top',
        headerName: 'Screen Top Depth (ft)',
        type: 'number',
        minWidth: 150,
      },
      {
        field: 'screen_depth_bottom',
        headerName: 'Screen Bottom Depth (ft)',
        type: 'number',
        minWidth: 200,
      },
      actionColumnDef({ resource: 'ocotillo.thing/well-screen' }),
    ]
  }, [])

  const assetColumns: GridColDef[] = useMemo(() => {
    return [
      { field: 'name', headerName: 'Name', minWidth: 150 },
      { field: 'uri', headerName: 'URL', flex: 1 },
      actionColumnDef({ resource: 'ocotillo.asset' }),
    ]
  }, [])

  const { dataGridProps: sensorDataGridProps } = useDataGrid<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
  })

  const sensorColumns: GridColDef<ISensor>[] = useMemo(() => {
    return [
      ...sensorDefaultColumns,
      actionColumnDef({ resource: 'ocotillo.sensor' }),
    ]
  }, [])

  const { dataGridProps: observationDataGridProps } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      cacheTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })
  const { rows: observations, loading: observationsIsloading } =
    observationDataGridProps

  useEffect(() => {
    if (!observations || observations.length === 0) return

    const source: IHydrographDatasource[] = [
      {
        id: 1,
        name: 'Groundwater Level',
        style: 'scatter',
        data:
          observations.map((obs) => ({
            phenomenonTime: new Date(obs.observation_datetime),
            result: Number(obs.depth_to_water_bgs),
          })) || [],
      },
    ]
    setHydrographDatasource(source)
  }, [observations])

  return (
    <Show
      isLoading={isLoading}
      breadcrumb={<Breadcrumb hideIcons={true} />}
      title={
        <Typography variant="h5">{`Show Well${well?.name ? `: ${well?.name}` : ''}`}</Typography>
      }
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CoreWellInfoCard well={well} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <InteractiveSatelliteMapCard well={well} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <HydrographCard
              well={well}
              rows={observations}
              dataSource={hydrographDatasource}
              isLoading={observationsIsloading}
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
        {/* Equipment */}
        <Card elevation={2}>
          <CardHeader
            title={
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SettingsInputAntenna color="primary" />
                  <Typography variant="body1" fontWeight="bold">
                    Equipment
                  </Typography>
                </Stack>
                <CreateButton resource="ocotillo.sensor" />
              </Stack>
            }
          />
          <CardContent>
            <DataGrid
              rowHeight={settings.rowHeight}
              rows={sensorDataGridProps.rows}
              columns={sensorColumns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Well Screens */}
        <Card elevation={2}>
          <CardHeader
            title={
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MoreVertOutlined color="primary" />
                  <Typography variant="body1" fontWeight="bold">
                    Well Screens
                  </Typography>
                </Stack>
                <CreateButton resource="ocotillo.thing/well-screen" />
              </Stack>
            }
          />
          <CardContent>
            <DataGrid
              rowHeight={settings.rowHeight}
              rows={wellScreenDataGridProps.rows}
              columns={wellScreenColumns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
              }}
            />
          </CardContent>
        </Card>
        <div>
          <ContactsAccordion id={well?.id} />
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%' }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Image color="primary" />
                  <Typography variant="body1" fontWeight="bold">
                    Attachments
                  </Typography>
                </Stack>
                <CreateButton resource="ocotillo.asset" />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              {(!assets || assets.length === 0) && (
                <Box textAlign="center" py={4}>
                  <Image
                    sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    No attachments available.
                  </Typography>
                </Box>
              )}
              {assets && assets.length > 0 && (
                <Stack spacing={3}>
                  <DataGrid
                    rowHeight={settings.rowHeight}
                    columns={assetColumns}
                    rows={assets}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                  />
                  <Box>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      Image Gallery
                    </Typography>
                    <ImageList
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        overflowX: 'auto',
                        gap: 2,
                      }}
                      cols={3}
                    >
                      {(assets ?? []).map(
                        (
                          img: { signed_url: string; name?: string },
                          idx: number
                        ) => (
                          <ImageListItem
                            key={idx}
                            sx={{
                              minWidth: 200,
                              borderRadius: 2,
                              overflow: 'hidden',
                              boxShadow: 2,
                            }}
                          >
                            <img
                              src={img.signed_url}
                              alt={img.name || `Attachment ${idx + 1}`}
                              style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: 8,
                              }}
                            />
                          </ImageListItem>
                        )
                      )}
                    </ImageList>
                  </Box>
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon color="primary" />
                <Typography variant="body1" fontWeight="bold">
                  Technical Details
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Card elevation={1}>
                <DynamicShowDisplay<IWell>
                  record={well}
                  fieldConfigs={fieldConfigs}
                />
              </Card>
            </AccordionDetails>
          </Accordion>
        </div>
      </Stack>
    </Show>
  )
}
