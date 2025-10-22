import { HttpError, useResourceParams, useShow } from '@refinedev/core'
import { Breadcrumb, CreateButton, Show, useDataGrid } from '@refinedev/mui'
import { IWell } from '@/interfaces/ocotillo/IThing'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { IHydrographDatasource } from '@/interfaces/st2/IHydrographDatasource'
import Grid from '@mui/material/Grid2'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { ISensor } from '@/interfaces/ocotillo/ISensor'
import SettingsInputAntenna from '@mui/icons-material/SettingsInputAntenna'
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined'
import { settings } from '@/settings'
import { sensorDefaultColumns } from '@/pages/ocotillo/sensor'
import { actionColumnDef } from '@/components/CommonColumnDefs'
import {
  CoreWellInfoCard,
  InteractiveSatelliteMapCard,
  HydrographCard,
  RecentWaterLevelObservationsCard,
  ContactsAccordion,
  AttachmentsAccordion,
} from '@/components'

export const WellShow = () => {
  const {
    queryResult: { data, isLoading },
  } = useShow<IWell, HttpError>()

  const well = data?.data

  const [hydrographDatasource, setHydrographDatasource] = useState<
    IHydrographDatasource[]
  >([])
  const { id } = useResourceParams()

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

  const { dataGridProps: idLinkDataGridProps } = useDataGrid({
    resource: `thing/${id}/id-link`,
    dataProviderName: 'ocotillo',
    // meta: {
    //   params: {
    //     thing_id: id,
    //   },
    // },
    queryOptions: {
      cacheTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })
  const idLinkColumns = useMemo(()=>{
    return [
      { field: 'alternate_id', headerName: 'Alternate ID', minWidth: 150 },
      { field: 'alternate_organization', headerName: 'Organization', minWidth: 150 },
      { field: 'relation', headerName: 'Relation', minWidth: 150 },
    ]
  }, [])

  const { rows: observations, loading: observationsIsloading } =
    observationDataGridProps

  const {rows: idLinks, loading: idLinksIsloading} = idLinkDataGridProps
  const usgs_id = idLinks?.find((link: any) => link.alternate_organization === 'USGS')?.alternate_id || 'N/A'
  const osepod_id = idLinks?.find((link: any) => link.alternate_organization === 'NMOSE'
  && link.relation === 'OSEPOD'
  )?.alternate_id || 'N/A'

  useEffect(() => {
    if (!idLinks || idLinks.length === 0) return
    if (idLinksIsloading) return
  }, [idLinks, idLinksIsloading])

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
            <CoreWellInfoCard well={well}
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

        {/* Alternate IDs */}
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
                    Alternate IDs
                  </Typography>
                </Stack>
                <CreateButton resource="ocotillo.thing/id-link" />
              </Stack>
            }
          />

          <CardContent>
            <DataGrid
              rowHeight={settings.rowHeight}
              rows={idLinkDataGridProps.rows}
              columns={idLinkColumns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
            />
          </CardContent>
        </Card>
        {/* OSE Card */}
        <Card elevation={2}>
        </Card>
        {/* USGS Card */}
        <Card elevation={2}>
        </Card>

        <Box component="div">
          <ContactsAccordion id={well?.id} />
          <AttachmentsAccordion id={well?.id} />
        </Box>
      </Stack>
    </Show>
  )
}
