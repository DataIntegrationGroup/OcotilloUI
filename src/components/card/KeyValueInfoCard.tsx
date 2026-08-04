import { ReactNode, useMemo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { ExternalLink } from '../ExternalLink'
import { CardHeaderTitle } from './CardHeaderTitle'
import { settings } from '@/settings'

export type KeyValueInfoRow = {
  id: number
  name: string
  value: unknown
}

// Detects https values so they render as ExternalLink instead of raw text.
const isHttpsUrl = (value: unknown): value is `https://${string}` =>
  typeof value === 'string' && value.startsWith('https://')

type KeyValueInfoCardProps = {
  icon: ReactNode
  title: string
  /** Text shown in place of any https value in the grid. */
  linkLabel: string
  emptyMessage: string
  errorMessage: string
  rows: KeyValueInfoRow[] | undefined
  isLoading: boolean
  isError: boolean
}

// Shared shell for the external-source info cards on the well details page
// (OSE POD, USGS). Keeps the grid mounted at all times so the card holds a
// consistent height and shows loading, empty, and error states in one overlay
// instead of stacking messages above a collapsed card.
export const KeyValueInfoCard = ({
  icon,
  title,
  linkLabel,
  emptyMessage,
  errorMessage,
  rows,
  isLoading,
  isError,
}: KeyValueInfoCardProps) => {
  const sortedRows = useMemo(
    () =>
      // Pin URL rows to the top so the useful links are easy to find for users.
      [...(rows ?? [])].sort(
        (a, b) => Number(isHttpsUrl(b.value)) - Number(isHttpsUrl(a.value))
      ),
    [rows]
  )

  const columns = useMemo<GridColDef<KeyValueInfoRow>[]>(
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
        renderCell: ({ value }) => {
          if (isHttpsUrl(value)) {
            return <ExternalLink href={value}>{linkLabel}</ExternalLink>
          }

          return value == null ? '' : String(value)
        },
      },
    ],
    [linkLabel]
  )

  const slots = useMemo(
    () => ({
      noRowsOverlay: () => (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
          }}
        >
          <Typography
            variant="body1"
            textAlign="center"
            color={isError ? 'warning.main' : 'text.secondary'}
          >
            {isError ? errorMessage : emptyMessage}
          </Typography>
        </Box>
      ),
    }),
    [emptyMessage, errorMessage, isError]
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <CardHeaderTitle icon={icon} title={title} />
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        <DataGrid<KeyValueInfoRow>
          rows={sortedRows}
          columns={columns}
          getRowId={(row) => row.id}
          rowHeight={settings.rowHeight}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          slots={slots}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
          }}
        />
      </Box>
    </Paper>
  )
}
