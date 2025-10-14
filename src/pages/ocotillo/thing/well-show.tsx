import { HttpError, useList, useResourceParams, useShow } from '@refinedev/core'
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
import Contacts from '@mui/icons-material/Contacts'
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
      { field: 'contact_type', headerName: 'Contact Type', minWidth: 150 },
      {
        field: 'emails',
        headerName: 'Email',
        minWidth: 200,
        renderCell: (params: any) => {
          if (!params.row.emails || params.row.emails.length === 0) return '-'
          return (
            <div>
              {params.row.emails.map((email: any, idx: number) => (
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
        renderCell: (params: any) => {
          if (!params.row.phones || params.row.phones.length === 0) return '-'
          return (
            <div>
              {params.row.phones.map((phone: any, idx: number) => (
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
        renderCell: (params: any) => {
          if (!params.row.addresses || params.row.addresses.length === 0)
            return '-'
          return (
            <div>
              {params.row.addresses.map((address: any, idx: number) => (
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
    <Show isLoading={isLoading}>
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
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%' }}
              >
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
