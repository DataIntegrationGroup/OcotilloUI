import { useMemo } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Chip } from '@mui/material'
import {
  IAddress,
  IContact,
  IEmail,
  IPhone,
} from '@/interfaces/ocotillo/IContact'

type ContactsComponentProps = {
  contacts: IContact[]
}

export const ContactsComponent = ({ contacts }: ContactsComponentProps) => {
  const columns: GridColDef<IContact>[] = useMemo(() => {
    return [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
      },
      {
        field: 'role',
        headerName: 'Role',
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,

        renderCell: (params) => {
          return (
            <>
              {params.row.emails?.map((p: IEmail, idx: number) => (
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
            {params.row.phones?.map((p: IPhone, idx: number) => (
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
              {params.row.addresses?.map((a: IAddress, idx: number) => (
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
      <DataGrid<IContact>
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
