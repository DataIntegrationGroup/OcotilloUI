import { useList, useResourceParams, useShow } from '@refinedev/core'
import { Show, useDataGrid } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IWell } from '@/interfaces/ocotillo/IThing'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardHeader,
  CircularProgress,
  ImageList,
  ImageListItem,
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
import { settings } from '@/settings'
import { ContactsComponent } from '@/components/ContactsComponent'
import { sensorDefaultColumns } from '@/pages/ocotillo/sensor'

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
    const depths = observations.map((obs) => Number(obs.depth_to_water))

    setMaxDepth(Math.max(...depths))
    setMaxDepthDatetime(observations[indexOfMax(depths)].observation_datetime)
    setMinDepthDatetime(observations[indexOfMin(depths)].observation_datetime)
    setMinDepth(Math.min(...depths))
  }, [observations])

  return (
    <Card>
      <CardHeader title="Water Level Stats" />
      <Box padding={2}>
        <Typography variant="body1">
          Max Depth: {maxDepth.toFixed(2)} ft --
          {new Date(maxDepthDatetime).toLocaleString()}
        </Typography>
        <Typography variant="body1">
          Min Depth: {minDepth.toFixed(2)} ft --
          {new Date(minDepthDatetime).toLocaleString()}
        </Typography>
      </Box>
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
            result: Number(obs.depth_to_water),
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
        field: 'depth_to_water',
        headerName: 'Depth To Water (ft)',
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

  const { data: contacts } = useList({
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
    ]
  }, [])

  const assetColumns: GridColDef[] = useMemo(() => {
    return [
      { field: 'name', headerName: 'Name', minWidth: 150 },
      { field: 'uri', headerName: 'URL', flex: 1 },
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
    return [...sensorDefaultColumns]
  }, [])

  return (
    <Show isLoading={isLoading || observationsIsloading}>
      <Grid container spacing={2}>
        <Grid size={6}>
          <Card>
            <CardHeader title={`Well: ${record?.name || 'Loading...'}`} />
            <Box padding={2}>
              <Typography variant="body1">
                Release Status: {record?.release_status || ''}
              </Typography>
              <Typography variant="body1">
                Well Type: {record?.well_type || ''}
              </Typography>
              <Typography variant="body1">
                Hole Depth (ft): {record?.hole_depth || ''}
              </Typography>
              <Typography variant="body1">
                Well Depth (ft): {record?.well_depth || ''}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={6}>
          <WaterlevelStats observations={observations} />
        </Grid>
        <Grid size={6}>
          <Card>
            <CardHeader title="Hydrograph" />
            <Box position={'relative'}>
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
          </Card>
        </Grid>
        <Grid size={6}>
          <Card>
            <DataGrid
              rows={observations}
              loading={observationsIsloading}
              getRowId={(row) => row.id}
              rowHeight={settings.rowHeight}
              columns={observationColumns}
              pageSizeOptions={[10]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
            />
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardHeader title="Equipment" />
            <Box padding={2}>
              <DataGrid
                rows={sensorDataGridProps.rows}
                columns={sensorColumns}
                pageSizeOptions={[10]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
              />
            </Box>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardHeader title="Well Screens" />
            <Box padding={2}>
              <DataGrid
                rows={wellScreenDataGridProps.rows}
                columns={wellScreenColumns}
                pageSizeOptions={[10]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
              />
            </Box>
          </Card>
        </Grid>
        <Grid size={12}>
          <Accordion expanded>
            <AccordionSummary>
              <Typography>
                <b>Contacts</b>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {contacts && <ContactsComponent contacts={contacts.data} />}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid size={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2-content"
              id="panel2-header"
            >
              <Typography>Attachments</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {(!assets || assets.length === 0) && (
                <Typography variant="body2" color="textSecondary">
                  No attachments available.
                </Typography>
              )}
              {assets && assets.length > 0 && (
                <Box>
                  <DataGrid
                    columns={assetColumns}
                    rows={assets}
                    pageSizeOptions={[10]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                    // pageSizeOptions={[]}
                    // initialState={{
                    //   pagination: {
                    //     paginationModel: { pageSize: 10, page: 0 },
                    //   },
                    // }}
                  />
                  <ImageList
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      overflowX: 'auto',
                    }}
                    cols={3}
                  >
                    {(assets ?? []).map(
                      (
                        img: { signed_url: string; name?: string },
                        idx: number
                      ) => (
                        <ImageListItem key={idx} sx={{ minWidth: 200 }}>
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
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid size={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2-content"
              id="panel2-header"
            >
              <Typography>Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Card>
                <DynamicShowDisplay<IWell>
                  record={record}
                  fieldConfigs={fieldConfigs}
                />
              </Card>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Show>
  )
}
