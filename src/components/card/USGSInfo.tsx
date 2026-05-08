import { useMemo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { ExternalLink } from '@/components'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useUSGSSiteInfo } from '@/hooks'
import { Public } from '@mui/icons-material'
import { settings } from '@/settings'

type InfoRow = {
  id: number
  name: string
  value: string
}

const isHttpUrl = (
  value: unknown
): value is `https://${string}` | `http://${string}` =>
  typeof value === 'string' &&
  (value.startsWith('https://') || value.startsWith('http://'))

export const USGSInfoCard = ({ site_id }) => {
  const query = useUSGSSiteInfo(site_id)
  const rows = useMemo(() => {
    return [...(query.data ?? [])].sort((a, b) => {
      const aIsUrl = isHttpUrl(a.value)
      const bIsUrl = isHttpUrl(b.value)

      if (aIsUrl === bIsUrl) return 0
      return aIsUrl ? -1 : 1
    })
  }, [query.data])

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
          if (isHttpUrl(value)) {
            return <ExternalLink href={value}>Water Services API</ExternalLink>
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
        <Public color="primary" />
        <Typography variant="body1" fontWeight="bold">
          USGS Information
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {query.data?.length == 0 && (
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            padding={1}
          >
            No USGS data available for this well.
          </Typography>
        )}
        {query.isError && (
          <Typography
            variant="body1"
            textAlign="center"
            color="warning.main"
            padding={1}
          >
            Error fetching USGS info.
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
