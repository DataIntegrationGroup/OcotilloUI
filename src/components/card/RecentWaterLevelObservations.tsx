import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  Box,
  Skeleton,
} from '@mui/material'
import { TableChartOutlined } from '@mui/icons-material'
import { IWell, IObservation } from '@/interfaces/ocotillo'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { settings } from '@/settings'
import { formatAppDateTime } from '@/utils'

export type WaterLevelObservationRow = Omit<IObservation, 'created_at'> & {
  created_at?: string | null
  water_level_method?: string | null
  water_level_status?: string | null
  water_level_measuring_staff?: string | null
  water_level_notes?: string | null
  water_level_data_quality?: string | null
}

export const RecentWaterLevelObservationsCard = ({
  well,
  rows,
  isLoading = false,
}: {
  well: IWell
  rows: readonly Partial<WaterLevelObservationRow>[]
  isLoading: boolean
}) => {
  const cols: GridColDef<Partial<WaterLevelObservationRow>>[] = useMemo(() => {
    return [
      {
        field: 'observation_datetime',
        headerName: 'Date/Time',
        valueGetter: (isoDate: string) => formatAppDateTime(isoDate),
        minWidth: 200,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'depth_to_water_bgs',
        headerName: 'Depth To Water (ft bgs)',
        type: 'number',
        minWidth: 175,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        minWidth: 150,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'water_level_method',
        headerName: 'Method',
        minWidth: 250,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'water_level_status',
        headerName: 'Level Status',
        minWidth: 150,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'water_level_measuring_staff',
        headerName: 'Measuring Staff',
        minWidth: 150,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'water_level_notes',
        headerName: 'Notes',
        minWidth: 375,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'water_level_data_quality',
        headerName: 'Data Quality',
        minWidth: 375,
        headerAlign: 'left',
        align: 'left',
      },
    ]
  }, [])

  if (!well || isLoading) {
    return <LoadingCard />
  }

  const measuringNote = well.measuring_notes?.[0]

  return (
    <Card
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
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
        {rows.length === 0 ? (
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
            rows={rows}
            loading={isLoading}
            getRowId={(row) => row.id ?? `obs-${row.observation_datetime}`}
            rowHeight={settings.rowHeight}
            columns={cols}
            disableRowSelectionOnClick
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
        {measuringNote && (
          <>
            <Typography variant="h6" component="div" sx={{ pt: 1 }}>
              Measurement Note
            </Typography>
            <Typography
              variant="body2"
              component="div"
              color="textSecondary"
              sx={{ pt: 1 }}
            >
              {measuringNote?.content}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const LoadingCard = () => {
  return (
    <Card
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
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
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{ borderRadius: '0.5rem' }}
        />
      </CardContent>
    </Card>
  )
}
