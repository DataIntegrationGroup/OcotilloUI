import React, { useMemo, useState } from 'react'
import { Breadcrumb, List, useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  IAddress,
  IContact,
  IEmail,
  IPhone,
} from '@/interfaces/ocotillo/IContact'
import { Card, CardHeader, SxProps, Typography } from '@mui/material'
import { Email, Home, Phone } from '@mui/icons-material'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { useLink } from '@refinedev/core'
import { settings } from '@/settings'

export const ContactList: React.FC = () => {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  )

  const { dataGridProps } = useDataGrid<IContact>()
  const Link = useLink()

  const columns = useMemo<GridColDef<IContact>[]>(
    () => [
      idColumnDef(),
      {
        field: 'things',
        headerName: 'Things',
        type: 'string',
        minWidth: 150,
        valueGetter: (_, row) =>
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

  const { dataGridProps: phoneDataGridProps } = useDataGrid<IEmail>({
    dataProviderName: 'ocotillo',
    resource: `contact/${selectedContactId}/phone`,
    meta: { enabled: !!selectedContactId },
  })

  const { dataGridProps: addressDataGridProps } = useDataGrid<IAddress>({
    dataProviderName: 'ocotillo',
    resource: `contact/${selectedContactId}/address`,
    meta: { enabled: !!selectedContactId },
  })

  return (
    <List breadcrumb={<Breadcrumb hideIcons={true} />}>
      <Card
        className={'description'}
        variant="outlined"
        sx={{
          marginTop: 1,
          marginBottom: 1,
          padding: 1,
        }}
      >
        <Typography variant="body1">
          {'Contacts are used to represent people or organizations.'}
        </Typography>
      </Card>
      <DataGrid
        {...dataGridProps}
        rowHeight={settings.rowHeight}
        disableRowSelectionOnClick={false}
        columns={columns}
        onRowSelectionModelChange={(params) => {
          setSelectedContactId(params.length > 0 ? (params[0] as number) : null)
        }}
      />
      {selectedContactId && (
        <>
          <EmailInfoCard dataGridProps={emailDataGridProps} />
          <PhoneInfoCard dataGridProps={phoneDataGridProps} />
          <AddressInfoCard dataGridProps={addressDataGridProps} />
        </>
      )}
    </List>
  )
}

const EmailInfoCard = ({ dataGridProps }: { dataGridProps: any }) => {
  const columns = useMemo<GridColDef<IEmail>[]>(
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

  return (
    <InfoCard
      title="Email"
      icon={<Email />}
      dataGridProps={dataGridProps}
      columns={columns}
    />
  )
}

const PhoneInfoCard = ({ dataGridProps }: { dataGridProps: any }) => {
  const columns = useMemo<GridColDef<IPhone>[]>(
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

  return (
    <InfoCard
      title="Phone"
      icon={<Phone />}
      dataGridProps={dataGridProps}
      columns={columns}
    />
  )
}

const AddressInfoCard = ({ dataGridProps }: { dataGridProps: any }) => {
  const columns = useMemo<GridColDef<IAddress>[]>(
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

  return (
    <InfoCard
      title="Address"
      icon={<Home />}
      dataGridProps={dataGridProps}
      columns={columns}
    />
  )
}

const InfoCard = ({
  title,
  icon,
  dataGridProps,
  columns,
}: {
  title: string
  icon: React.ReactNode
  dataGridProps: any
  columns: any[]
}) => (
  <Card sx={{ mt: 2 }}>
    <IconCardHeader text={title} icon={icon} />
    <DataGrid {...dataGridProps} columns={columns} />
  </Card>
)

const IconCardHeader = ({
  text,
  icon,
  sx,
}: {
  text: string
  icon: React.ReactNode
  sx?: SxProps
}) => (
  <CardHeader
    sx={sx}
    title={
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {text}
      </span>
    }
  />
)
