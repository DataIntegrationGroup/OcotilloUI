import { useList, useResourceParams, useShow } from '@refinedev/core'
import { CreateButton, Show, useDataGrid } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IWell } from '@/interfaces/ocotillo/IThing'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  ImageList,
  ImageListItem,
  Stack,
  Typography,
} from '@mui/material'
import { Hydrograph } from '@/components/Hydrographs/Hydrograph'
import { useEffect, useMemo, useState } from 'react'
import { IHydrographDatasource } from '@/interfaces/st2/IHydrographDatasource'
import { Box } from '@mui/system'
import Grid from '@mui/material/Grid2'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { IObservation } from '@/interfaces/ocotillo/IObservation'
import { ISensor } from '@/interfaces/ocotillo/ISensor'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SettingsInputAntenna from '@mui/icons-material/SettingsInputAntenna'
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined'
import Contacts from '@mui/icons-material/Contacts'
import Image from '@mui/icons-material/Image'
import InfoIcon from '@mui/icons-material/Info'
import { settings } from '@/settings'
import { sensorDefaultColumns } from '@/pages/ocotillo/sensor'
import { actionColumnDef } from '@/components/CommonColumnDefs'
import { AnalyticsOutlined, StackedLineChart, TableChartOutlined } from '@mui/icons-material'

function indexOfMax(arr) {
  if (arr.length === 0) {
    return -1
  }

  let max = arr[0]
  let maxIndex = 0

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i
      max = arr[i]
    }
  }

  return maxIndex
}
function indexOfMin(arr) {
  if (arr.length === 0) {
    return -1
  }

  let min = arr[0]
  let minIndex = 0

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      minIndex = i
      min = arr[i]
    }
  }

  return minIndex
}

const WaterlevelStats = ({
  observations,
}: {
  observations: readonly IObservation[]
}) => {
  const [maxDepth, setMaxDepth] = useState(0)
  const [minDepth, setMinDepth] = useState(0)
  const [maxDepthDatetime, setMaxDepthDatetime] = useState<string>('')
  const [minDepthDatetime, setMinDepthDatetime] = useState<string>('')

  useEffect(() => {
    if (observations.length === 0) return
    const depths = observations.map((obs) => Number(obs.depth_to_water_bgs))

    setMaxDepth(Math.max(...depths))
    setMaxDepthDatetime(observations[indexOfMax(depths)].observation_datetime)
    setMinDepthDatetime(observations[indexOfMin(depths)].observation_datetime)
    setMinDepth(Math.min(...depths))
  }, [observations])

  if (observations.length === 0) {
    return (
      <Card elevation={2}>
        <CardHeader 
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <AnalyticsOutlined color="primary" />
              <Typography variant="body1" fontWeight="bold">
                Water Level Statistics
              </Typography>
            </Stack>
          }
        />
        <CardContent>
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No water level data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Water level observations will appear here once data is collected
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card elevation={2}>
      <CardHeader 
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <AnalyticsOutlined color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Water Level Statistics
            </Typography>
          </Stack>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body1" fontWeight="bold">
              Maximum Depth: {maxDepth.toFixed(2)} ft
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(maxDepthDatetime).toLocaleString()}
            </Typography>
          </Box>
          
          <Divider />
          
          <Box>
            <Typography variant="body1" fontWeight="bold">
              Minimum Depth: {minDepth.toFixed(2)} ft
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(minDepthDatetime).toLocaleString()}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export const WellShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as IWell

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
  const [refreshHydrograph, setRefreshHydrograph] = useState<number>(0)
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

  // console.log('props', observationDataGridProps)
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

  const observationColumns: GridColDef<IObservation>[] = useMemo(() => {
    return [
      {
        field: 'observation_datetime',
        headerName: 'Date/Time',
        valueGetter: (params) => new Date(params),
        type: 'dateTime',
        minWidth: 180,
      },
      {
        field: 'depth_to_water_bgs',
        headerName: 'Depth To Water (ft bgs)',
        type: 'number',
        minWidth: 150,
      },
      { field: 'release_status', headerName: 'Release Status', minWidth: 150 },
      { field: 'level_status', headerName: 'Level Status', minWidth: 150 },
    ]
  }, [])

  const { dataGridProps: wellScreenDataGridProps } = useDataGrid({
    resource: 'thing/well-screen',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
  })

  const { dataGridProps: contactDataGridProps } = useDataGrid({
    resource: 'contact',
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

  const contactColumns: GridColDef[] = useMemo(() => {
    return [
      { field: 'name', headerName: 'Name', minWidth: 150, flex: 1 },
      { field: 'role', headerName: 'Role', minWidth: 120 },
      {
        field: 'emails',
        headerName: 'Email',
        minWidth: 200,
        renderCell: (params) => {
          if (!params.row.emails || params.row.emails.length === 0) return '-'
          return (
            <div>
              {params.row.emails.map((email, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>
                  {email.email}
                </div>
              ))}
            </div>
          )
        },
      },
      {
        field: 'phones',
        headerName: 'Phone',
        minWidth: 150,
        renderCell: (params) => {
          if (!params.row.phones || params.row.phones.length === 0) return '-'
          return (
            <div>
              {params.row.phones.map((phone, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>
                  {phone.phone_number}
                </div>
              ))}
            </div>
          )
        },
      },
      {
        field: 'addresses',
        headerName: 'Address',
        minWidth: 250,
        renderCell: (params) => {
          if (!params.row.addresses || params.row.addresses.length === 0) return '-'
          return (
            <div>
              {params.row.addresses.map((address, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>
                  {address.address_line_1}
                  {address.address_line_2 && `, ${address.address_line_2}`}
                  {address.city && `, ${address.city}`}
                  {address.state && ` ${address.state}`}
                  {address.postal_code && ` ${address.postal_code}`}
                </div>
              ))}
            </div>
          )
        },
      },
      actionColumnDef({ resource: 'ocotillo.contact' }),
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
    return [...sensorDefaultColumns, actionColumnDef({ resource: 'ocotillo.sensor' })]
  }, [])

  return (
    <Show isLoading={isLoading || observationsIsloading}>
      <Stack spacing={3}>
        {/* Title and Stats */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title={
                  <Typography variant="h4" fontWeight="bold">
                    {record?.name || 'Loading...'}
                  </Typography>
                }
              />
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip 
                      label={record?.well_type || 'Unknown Type'} 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      label={record?.release_status || 'Unknown Status'} 
                      color='warning'
                      variant="outlined"
                    />
                  </Stack>
                  
                  <Stack direction="row" spacing={4} mt={2}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        Hole Depth: {record?.hole_depth || 'N/A'} ft
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        Well Depth: {record?.well_depth || 'N/A'} ft
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <WaterlevelStats observations={observations} />
          </Grid>
        </Grid>

        {/* Hydrograph / Water Level */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StackedLineChart color="primary" />
                    <Typography variant="body1" fontWeight="bold">
                      Hydrograph
                    </Typography>
                  </Stack>
                }
              />
              <CardContent>
                {observations.length === 0 ? (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    sx={{ minHeight: 200 }}
                  >
                    <Box textAlign="center">
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        No Hydrograph Data
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Water level observations are needed to generate a hydrograph
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box position="relative" sx={{ minHeight: 420, overflow: 'hidden' }}>
                    {observationsIsloading && (
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        sx={{ transform: 'translate(-50%, -50%)' }}
                      >
                        <CircularProgress />
                      </Box>
                    )}
                    <Hydrograph
                      datasource={hydrographDatasource}
                      refresh={refreshHydrograph}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TableChartOutlined color="primary" />
                    <Typography variant="body1" fontWeight="bold">
                      Recent Water Level Observations
                    </Typography>
                  </Stack>
                }
              />
              <CardContent>
                {observations.length === 0 ? (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    sx={{ minHeight: 200 }}
                  >
                    <Box textAlign="center">
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        No observations recorded
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Water level measurements will appear here
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <DataGrid
                    rows={observations}
                    loading={observationsIsloading}
                    getRowId={(row) => row.id}
                    rowHeight={settings.rowHeight}
                    columns={observationColumns}
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
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Equipment */}
        <Card elevation={2}>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between">
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
              <Stack direction="row" alignItems="center" justifyContent="space-between">
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

        {/* Contacts */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Contacts color="primary" />
                <Typography variant="body1" fontWeight="bold">
                  Contacts
                </Typography>
              </Stack>
              <CreateButton resource="ocotillo.contact" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <DataGrid
              rowHeight={settings.rowHeight}
              rows={contactDataGridProps.rows}
              columns={contactColumns}
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
          </AccordionDetails>
        </Accordion>

        {/* Assets*/}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
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
                <Image sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
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

        {/* All details listed */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
          >
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
                record={record}
                fieldConfigs={fieldConfigs}
              />
            </Card>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Show>
  )
}
