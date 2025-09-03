import React, { useMemo, useState } from 'react'
import { List, useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  IAddress,
  IContact,
  IEmail,
  IPhone,
} from '@/interfaces/ocotillo/IContact'
import { Card, CardHeader, Typography } from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import HomeIcon from '@mui/icons-material/Home'
import { Phone } from '@mui/icons-material'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { useLink } from '@refinedev/core'

const IconCardHeader = ({ text, icon }) => {
  return (
    <CardHeader
      title={
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {icon}
          {text}
        </span>
      }
    />
  )
}

export const ContactList: React.FC = () => {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  )

  const { dataGridProps } = useDataGrid<IContact>()
  //   {
  //   resource: 'contact',
  //   dataProviderName: 'dataforge',
  //   queryOptions: {
  //     cacheTime: 60000, // Cache for 1 minute
  //     staleTime: 30000, // Consider data fresh for 30 seconds
  //   },
  // }
  const Link = useLink()

  const columns = useMemo<GridColDef<IContact>[]>(
    () => [
      idColumnDef(),
      {
        field: 'things',
        headerName: 'Things',
        type: 'string',
        minWidth: 150,
        valueGetter: (value, row) =>
          row.things.map((thing) => thing.name).join('; '),
        renderCell: (params) => {
          return (
            <div>
              {params.row.things.map((thing) => (
                <Link
                  go={{
                    to: {
                      resource: 'ocotillo.thing-well',
                      action: 'show',
                      id: thing.id,
                    },
                  }}
                >
                  {thing.name}
                </Link>
              ))}
            </div>
          )
        },
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
      { field: 'contact_type', headerName: 'Contact Type', minWidth: 150 },
      {
        field: 'created_at',
        headerName: 'Created At',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => new Date(params),
      },
      actionColumnDef(),
    ],
    []
  )
  const { dataGridProps: emailDataGridProps } = useDataGrid<IEmail>({
    dataProviderName: 'ocotillo',
    resource: `contact/${selectedContactId}/email`,
    meta: { enabled: !!selectedContactId },
  })

  const emailColumns = useMemo<GridColDef<IEmail>[]>(
    () => [
      idColumnDef(),
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
    dataProviderName: 'ocotillo',
    resource: `contact/${selectedContactId}/phone`,
    meta: { enabled: !!selectedContactId },
  })

  const phoneColumns = useMemo<GridColDef<IPhone>[]>(
    () => [
      idColumnDef(),
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
    dataProviderName: 'ocotillo',
    resource: `contact/${selectedContactId}/address`,
    meta: { enabled: !!selectedContactId },
  })

  const addressColumns = useMemo<GridColDef<IAddress>[]>(
    () => [
      idColumnDef(),
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

  const description = 'Contacts are used to represent people or organizations.'
  return (
    <>
      <List>
        <Card
          className={'description'}
          variant="outlined"
          sx={{
            marginTop: 1,
            marginBottom: 1,
            padding: 1,
          }}
        >
          <Typography variant="body1">{description}</Typography>
        </Card>

        <DataGrid
          {...dataGridProps}
          disableRowSelectionOnClick={false}
          columns={columns}
          onRowSelectionModelChange={(params) => {
            setSelectedContactId(
              params.length > 0 ? (params[0] as number) : null
            )
          }}
        />
        {selectedContactId && (
          <>
            <Card sx={{ marginTop: 2 }}>
              <IconCardHeader
                text={'Email'}
                icon={<EmailIcon style={{ marginRight: 8 }} />}
              />
              <DataGrid {...emailDataGridProps} columns={emailColumns} />
            </Card>
            <Card sx={{ marginTop: 2 }}>
              <IconCardHeader
                text={'Phone'}
                icon={<Phone style={{ marginRight: 8 }} />}
              />
              <DataGrid {...phoneDataGridProps} columns={phoneColumns} />
            </Card>
            <Card sx={{ marginTop: 2 }}>
              {/*<CardHeader title={'Address'} />*/}
              <IconCardHeader
                text={'Address'}
                icon={<HomeIcon style={{ marginRight: 8 }} />}
              />
              <DataGrid {...addressDataGridProps} columns={addressColumns} />
            </Card>
          </>
        )}
      </List>
    </>
  )
}
