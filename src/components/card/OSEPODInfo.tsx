import { useMemo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Engineering } from '@mui/icons-material'
import { useOSEPODInfo } from '@/hooks'
import { ExternalLink } from '@/components'
import { settings } from '@/settings'

type InfoRow = {
  id: number
  name: string
  value: unknown
}

// Detects https values so they render as ExternalLink instead of raw text.
const isHttpsUrl = (
  value: unknown
): value is `https://${string}` =>
  typeof value === 'string' && value.startsWith('https://')

type OSEPODInfoCardProps = {
  pod_id: string
}

export const OSEPODInfoCard = ({ pod_id }: OSEPODInfoCardProps) => {
  const podInfoQuery = useOSEPODInfo(pod_id)
  const rows = useMemo(() => {
    // Pin URL rows to the top so the useful links are easy to find for users.
    return [...(podInfoQuery.data ?? [])].sort((a, b) => {
      const aIsUrl = isHttpsUrl(a.value)
      const bIsUrl = isHttpsUrl(b.value)

      if (aIsUrl === bIsUrl) return 0
      return aIsUrl ? -1 : 1
    })
  }, [podInfoQuery.data])

  const columns = useMemo<GridColDef<InfoRow>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        minWidth: 175,
        flex: 0.8,
        headerAlign: 'left',
        align: 'left',
      },
      {
        field: 'value',
        headerName: 'Value',
        minWidth: 250,
        flex: 1.2,
        headerAlign: 'left',
        align: 'left',
        renderCell: ({ row, value }) => {
          if (isHttpsUrl(value)) {
            return <ExternalLink href={value}>NMWRRS Website Link</ExternalLink>
          }

          return value == null ? '' : String(value)
        },
      },
    ],
    []
  )

  return (
    <Paper
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
      <Box
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Engineering color="primary" />
        <Typography variant="body1" fontWeight="bold">
          OSEPOD Information
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {podInfoQuery.data?.length === 0 && (
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            padding={1}
          >
            No OSE POD data available for this well.
          </Typography>
        )}
        {podInfoQuery.isError && (
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            padding={1}
          >
            Error fetching OSE POD info.
          </Typography>
        )}
        {rows.length > 0 && (
          <DataGrid<InfoRow>
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeight={settings.rowHeight}
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
      </Box>
    </Paper>
  )
}
