import { useMemo } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore, History } from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { settings } from '@/settings'
import { ISample } from '@/interfaces/ocotillo'
import { formatAppDateTime } from '@/utils'

export const FieldEventHistoryAccordion = ({
  sample,
}: {
  sample?: Partial<ISample> | null
}) => {
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'event_date',
        headerName: 'Event Date',
        minWidth: 180,
        flex: 1,
        valueFormatter: (value) => (value ? formatAppDateTime(value) : ''),
      },
      {
        field: 'activity_type',
        headerName: 'Work Performed',
        minWidth: 180,
        flex: 1,
      },
      {
        field: 'contact_name',
        headerName: 'Field Staff',
        minWidth: 180,
        flex: 1,
      },
      {
        field: 'contact_organization',
        headerName: 'Organization',
        minWidth: 160,
        flex: 1,
      },
      {
        field: 'contact_role',
        headerName: 'Role',
        minWidth: 160,
        flex: 1,
      },
      {
        field: 'sample_method',
        headerName: 'Method',
        minWidth: 240,
        flex: 1.2,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        minWidth: 240,
        flex: 1.5,
      },
    ],
    []
  )

  const rows = useMemo(() => {
    if (!sample) return []

    return [
      {
        id: sample.id ?? 'field-event-row',
        event_date:
          sample.field_event?.event_date ?? sample.sample_date ?? null,
        activity_type: sample.field_activity?.activity_type ?? null,
        contact_name: sample.contact?.name ?? null,
        contact_organization: sample.contact?.organization ?? null,
        contact_role: sample.contact?.role ?? null,
        sample_method: sample.sample_method ?? null,
        notes: sample.field_event?.notes ?? sample.notes ?? null,
      },
    ]
  }, [sample])

  return (
    <Accordion elevation={2}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <History color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Field Event History
            </Typography>
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 3 }}>
        {!sample ? (
          <Alert severity="info">No field event history found.</Alert>
        ) : (
          <DataGrid
            rowHeight={settings.rowHeight}
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            hideFooterPagination
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
            }}
          />
        )}
      </AccordionDetails>
    </Accordion>
  )
}
