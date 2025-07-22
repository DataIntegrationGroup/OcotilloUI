import { useMemo, useState } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  IContact,
  IEmail,
  IPhone,
  IAddress,
} from '@/interfaces/dataforge/IContact'
import { List } from '@refinedev/mui'
import { Card, CardHeader } from '@mui/material'

export const ContactList: React.FC = () => {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  )

  const { dataGridProps } = useDataGrid<IContact>()

  const columns = useMemo<GridColDef<IContact>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'role',
        headerName: 'Role',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => new Date(params),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.id} />
              <ShowButton hideText recordItemId={row.id} />
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
        flex: 0.3,
      },
    ],
    []
  )
  const { dataGridProps: emailDataGridProps } = useDataGrid<IEmail>({
    dataProviderName: 'dataforge',
    resource: `contact/${selectedContactId}/email`,
    meta: { enabled: !!selectedContactId },
  })

  const emailColumns = useMemo<GridColDef<IEmail>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'email_type',
        headerName: 'Type',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'email',
        headerName: 'Email',
        type: 'string',
        minWidth: 200,
      },
    ],
    []
  )

  const { dataGridProps: phoneDataGridProps } = useDataGrid<IEmail>({
    dataProviderName: 'dataforge',
    resource: `contact/${selectedContactId}/phone`,
    meta: { enabled: !!selectedContactId },
  })

  const phoneColumns = useMemo<GridColDef<IPhone>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'phone_type',
        headerName: 'Type',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'phone_number',
        headerName: 'Phone',
        type: 'string',
        minWidth: 200,
      },
    ],
    []
  )

  const { dataGridProps: addressDataGridProps } = useDataGrid<IAddress>({
    dataProviderName: 'dataforge',
    resource: `contact/${selectedContactId}/address`,
    meta: { enabled: !!selectedContactId },
  })

  const addressColumns = useMemo<GridColDef<IAddress>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'address_type',
        headerName: 'Type',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'address_line_1',
        headerName: 'Address Line 1',
        type: 'string',
        minWidth: 200,
      },
      {
        field: 'address_line_2',
        headerName: 'Address Line 2',
        type: 'string',
        minWidth: 200,
      },
      {
        field: 'city',
        headerName: 'City',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'state',
        headerName: 'State',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'postal_code',
        headerName: 'Postal Code',
        type: 'string',
        minWidth: 150,
      },
    ],
    []
  )

  return (
    <>
      <List>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          onRowClick={(params) => {
            setSelectedContactId(params.row.id)
          }}
        />
        {selectedContactId && (
          <>
            <Card sx={{ marginTop: 2 }}>
              <CardHeader title={'Email'} />
              <DataGrid {...emailDataGridProps} columns={emailColumns} />
            </Card>
            <Card sx={{ marginTop: 2 }}>
              <CardHeader title={'Phone'} />
              <DataGrid {...phoneDataGridProps} columns={phoneColumns} />
            </Card>
            <Card sx={{ marginTop: 2 }}>
              <CardHeader title={'Address'} />
              <DataGrid {...addressDataGridProps} columns={addressColumns} />
            </Card>
          </>
        )}
      </List>
    </>
  )
}
