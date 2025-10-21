import { useMemo } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material'
import { CreateButton, useDataGrid } from '@refinedev/mui'
import { Contacts, ExpandMore } from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { actionColumnDef } from '@/components/CommonColumnDefs'
import { settings } from '@/settings'

export const ContactsAccordion = ({ id }: { id?: number }) => {
  const { dataGridProps } = useDataGrid({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      enabled: id != null,
    },
  })

  const columns = useMemo<GridColDef[]>(
    () => [
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
            <Box component="div">
              {params.row.emails.map((email: any, idx: number) => (
                <Box component="div" key={idx} sx={{ mb: '2px' }}>
                  {email.email}
                </Box>
              ))}
            </Box>
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
      actionColumnDef({ resource: 'ocotillo.contact' }) as GridColDef,
    ],
    []
  )

  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMore />}>
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
          rows={dataGridProps.rows ?? []}
          columns={columns}
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
  )
}
