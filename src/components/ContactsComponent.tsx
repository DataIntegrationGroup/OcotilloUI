import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useMemo } from 'react'
import { Chip } from '@mui/material'
import { linkColumn } from '@/utils/link'
import { useLink } from '@refinedev/core'

export const ContactsComponent = ({ contacts }) => {
  const columns: GridColDef[] = useMemo(() => {
    return [
      // linkColumn('ocotillo.contact', {
      //   field: 'id',
      //   headerName: 'ID',
      //   type: 'string',
      //   width: 100,
      // }),
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,

        renderCell: (params) => {
          return (
            <>
              {params.row.emails?.map((p, idx) => (
                <div
                  key={idx}
                  style={{ marginBottom: '5px', marginTop: '5px' }}
                >
                  {p.email} <Chip label={p.email_type} size="small" />
                </div>
              ))}
            </>
          )
        },
      },
      {
        field: 'phone',
        headerName: 'Phone',
        flex: 1,
        renderCell: (params) => (
          <>
            {params.row.phones?.map((p, idx) => (
              <div key={idx} style={{ marginBottom: '5px', marginTop: '5px' }}>
                {p.phone_number} <Chip label={p.phone_type} size="small" />
              </div>
            ))}
          </>
        ),
      },
      {
        field: 'address',
        headerName: 'Address',
        flex: 1,
        minWidth: 400,
        renderCell: (params) => {
          return (
            <>
              {params.row.addresses?.map((a, idx) => (
                <div
                  key={idx}
                  style={{ marginBottom: '5px', marginTop: '5px' }}
                >
                  {a.address_line_1}, {a.city} {a.state} {a.postal_code}{' '}
                  <Chip label={a.address_type} size="small" />
                </div>
              ))}
            </>
          )
        },
      },
    ]
  }, [])

  return (
    <>
      <DataGrid
        getRowHeight={() => 'auto'}
        getRowId={(row) => row.id}
        columns={columns}
        rows={contacts}
        pageSizeOptions={[10]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
      />
    </>
  )
}
