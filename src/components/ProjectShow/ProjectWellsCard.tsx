import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useDataGrid } from '@refinedev/mui'
import {
  Box,
  Button,
  Paper,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { captureEvent, setWellsProjectFilterSource } from '@/analytics/posthog'
import { releaseStatusColumnDef } from '@/components/CommonColumnDefs'
import { settings } from '@/settings'
import type { IWell } from '@/interfaces/ocotillo'
import { displayWellSiteName, formatAppDate } from '@/utils'
import { WellListColumnLabels } from '@/well-list/wellListColumnLabels'

export const ProjectWellsCard = ({
  projectId,
  projectName,
  totalWells,
}: {
  projectId?: string | number
  projectName?: string
  totalWells?: number
}) => {
  const navigate = useNavigate()

  const { dataGridProps } = useDataGrid<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    filters: {
      permanent: projectId
        ? [{ field: 'groups', operator: 'eq', value: projectId }]
        : [],
    },
    pagination: { pageSize: 50 },
    queryOptions: {
      enabled: Boolean(projectId),
    },
  })

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'name',
        headerName: WellListColumnLabels.name,
        type: 'string',
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'site_name',
        headerName: WellListColumnLabels.siteName,
        type: 'string',
        minWidth: 140,
        flex: 1,
        valueGetter: (_: unknown, row: IWell) => displayWellSiteName(row),
      },
      {
        field: 'monitoring_status',
        headerName: WellListColumnLabels.monitoring,
        type: 'string',
        width: 150,
      },
      {
        field: 'well_status',
        headerName: WellListColumnLabels.wellStatus,
        type: 'string',
        width: 140,
      },
      releaseStatusColumnDef<IWell>(),
      {
        field: 'created_at',
        headerName: WellListColumnLabels.createdAt,
        width: 130,
        valueGetter: (value: string) => formatAppDate(value),
      },
    ],
    []
  )

  const wellTotal = totalWells ?? dataGridProps.rowCount ?? 0
  const filteredWellsHref = projectId
    ? `/ocotillo/well?projectId=${projectId}`
    : '/ocotillo/well'

  const handleViewAllClick = () => {
    if (!projectId) return
    setWellsProjectFilterSource('project_show')
    captureEvent('project_show_view_all_wells_clicked', {
      project_id: projectId,
      project_name: projectName,
    })
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body1" fontWeight="bold">
          Associated Wells
        </Typography>
        {wellTotal > 0 ? (
          <Button
            component={Link}
            to={filteredWellsHref}
            size="small"
            onClick={handleViewAllClick}
          >
            View all {wellTotal} wells
          </Button>
        ) : null}
      </Box>
      <Box sx={{ px: 2, pb: 2 }}>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          rowHeight={settings.rowHeight}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(params) => {
            navigate(`/ocotillo/well/show/${params.id}`)
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
          }}
        />
      </Box>
    </Paper>
  )
}
