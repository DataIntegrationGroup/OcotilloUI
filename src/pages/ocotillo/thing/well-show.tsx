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
        <Grid size={12}>
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
              rowHeight={settings.rowHeight}
              {...observationDataGridProps}
              columns={observationColumns}
              pagination
              pageSizeOptions={[5, 10, 25]}
              paginationModel={{ pageSize: 10, page: 0 }}
            />
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardHeader title="Equipment" />
            <Box padding={2}>
              <DataGrid {...sensorDataGridProps} columns={sensorColumns} />
            </Box>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardHeader title="Well Screens" />
            <Box padding={2}>
              <DataGrid
                {...wellScreenDataGridProps}
                columns={wellScreenColumns}
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
                  <DataGrid columns={assetColumns} rows={assets} />
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
