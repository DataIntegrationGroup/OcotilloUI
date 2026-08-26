import React, { useEffect, useMemo, useState } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { captureEvent } from '@/analytics/posthog'
import {
  IAddress,
  IContact,
  IEmail,
  IPhone,
} from '@/interfaces/ocotillo/IContact'
import { Card, CardHeader, SxProps } from '@mui/material'
import { Email, Home, Phone } from '@mui/icons-material'
import { useLink } from '@refinedev/core'
import { settings } from '@/settings'
import { formatAppDateTime, formatPhone } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import { ListPage } from '@/components/ListPage'
import { useAccessCapabilities, useListPageDataGridAnalytics } from '@/hooks'
import { filterConfidentialRows, sanitizeContacts } from '@/utils'

export const ContactList: React.FC = () => {
  useEffect(() => {
    captureEvent('feature_used', { feature: 'contacts_list' })
  }, [])

  const { canViewConfidential } = useAccessCapabilities()
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  )

  const { dataGridProps } = useDataGrid<IContact>({
    pagination: { pageSize: 50 },
  })

  const dataGridPropsWithAnalytics = useListPageDataGridAnalytics(
    dataGridProps,
    'contacts'
  )

  const visibleContacts = useMemo(
    () => sanitizeContacts(dataGridProps.rows, canViewConfidential),
    [canViewConfidential, dataGridProps.rows]
  )

  const Link = useLink()

  const columns = useMemo<GridColDef<IContact>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 160,
        flex: 1,
        valueGetter: (_: unknown, row: IContact) => getContactDisplayName(row),
      },
      {
        field: 'organization',
        headerName: 'Organization',
        type: 'string',
        minWidth: 180,
        flex: 1,
        valueGetter: (_: unknown, row: IContact) => row.organization ?? '',
      },
      {
        field: 'role',
        headerName: 'Role',
        type: 'string',
        width: 140,
      },
      {
        field: 'contact_type',
        headerName: 'Contact Type',
        width: 140,
      },
      {
        field: 'primary_phone',
        headerName: 'Primary Phone',
        type: 'string',
        width: 160,
        sortable: false,
        valueGetter: (_: unknown, row: IContact) => {
          const primary = pickPrimary(
            row.phones,
            (p) => p.phone_type === 'Primary'
          )
          return primary?.phone_number ?? ''
        },
        renderCell: (params) => {
          if (!canViewConfidential) return <span />
          const primary = pickPrimary(
            params.row.phones,
            (p) => p.phone_type === 'Primary'
          )
          return primary?.phone_number ? (
            <span>{formatPhone(primary.phone_number)}</span>
          ) : (
            <span />
          )
        },
      },
      {
        field: 'primary_email',
        headerName: 'Primary Email',
        type: 'string',
        minWidth: 200,
        flex: 1,
        sortable: false,
        valueGetter: (_: unknown, row: IContact) => {
          const primary = pickPrimary(
            row.emails,
            (e) => e.email_type === 'Primary'
          )
          return primary?.email ?? ''
        },
        renderCell: (params) => {
          if (!canViewConfidential) return <span />
          const primary = pickPrimary(
            params.row.emails,
            (e) => e.email_type === 'Primary'
          )
          return primary?.email ? <span>{primary.email}</span> : <span />
        },
      },
      {
        field: 'things',
        headerName: 'Associated Sites',
        description:
          'Monitoring sites linked to this contact. Sort uses the alphabetically first linked site name.',
        type: 'string',
        minWidth: 180,
        flex: 1,
        valueGetter: (_: unknown, row: IContact) =>
          row.things?.map((thing) => thing.name).join('; ') ?? '',
        renderCell: (params) => {
          const things = params.row.things ?? []
          return (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {things.map((thing, idx) => (
                <span key={thing.id}>
                  {idx > 0 && ', '}
                  <Link
                    go={{
                      to: {
                        resource: 'ocotillo.thing-well',
                        action: 'show',
                        id: thing.id,
                      },
                    }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {thing.name}
                  </Link>
                </span>
              ))}
            </div>
          )
        },
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        width: 180,
        valueGetter: (isoDate: string) => formatAppDateTime(isoDate),
      },
    ],
    [canViewConfidential]
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
    <>
      <ListPage
        title="Contacts & Owners"
        columns={columns}
        dataGridProps={{ ...dataGridPropsWithAnalytics, rows: visibleContacts }}
        getRowId={(row) => row.id}
        hideHeaderButtons
        onRowClick={(params) =>
          captureEvent('contacts_row_clicked', { contact_id: params.id })
        }
        onSelectionChange={(params) =>
          setSelectedContactId(params.length > 0 ? (params[0] as number) : null)
        }
        accessResource="ocotillo.contact"
      />
      {selectedContactId && (
        <>
          {canViewConfidential && (
            <EmailInfoCard dataGridProps={emailDataGridProps} />
          )}
          {canViewConfidential && (
            <PhoneInfoCard dataGridProps={phoneDataGridProps} />
          )}
          {canViewConfidential && (
            <AddressInfoCard dataGridProps={addressDataGridProps} />
          )}
        </>
      )}
    </>
  )
}

const EmailInfoCard = ({ dataGridProps }: { dataGridProps: any }) => {
  const columns = useMemo<GridColDef<IEmail>[]>(
    () => [
      {
        field: 'email_type',
        headerName: 'Type',
        type: 'string',
        width: 140,
      },
      {
        field: 'email',
        headerName: 'Email',
        type: 'string',
        minWidth: 200,
        flex: 1,
      },
    ],
    []
  )

  return (
    <InfoCard
      title="Email"
      icon={<Email />}
      dataGridProps={{
        ...dataGridProps,
        rows: filterConfidentialRows(dataGridProps.rows, true),
      }}
      columns={columns}
    />
  )
}

const PhoneInfoCard = ({ dataGridProps }: { dataGridProps: any }) => {
  const columns = useMemo<GridColDef<IPhone>[]>(
    () => [
      {
        field: 'phone_type',
        headerName: 'Type',
        type: 'string',
        width: 140,
      },
      {
        field: 'phone_number',
        headerName: 'Phone',
        type: 'string',
        width: 180,
        renderCell: (params) => (
          <span>{formatPhone(params.row.phone_number)}</span>
        ),
      },
    ],
    []
  )

  return (
    <InfoCard
      title="Phone"
      icon={<Phone />}
      dataGridProps={{
        ...dataGridProps,
        rows: filterConfidentialRows(dataGridProps.rows, true),
      }}
      columns={columns}
    />
  )
}

const AddressInfoCard = ({ dataGridProps }: { dataGridProps: any }) => {
  const columns = useMemo<GridColDef<IAddress>[]>(
    () => [
      {
        field: 'address_type',
        headerName: 'Type',
        type: 'string',
        width: 120,
      },
      {
        field: 'address_line_1',
        headerName: 'Address',
        type: 'string',
        minWidth: 200,
        flex: 1,
      },
      {
        field: 'address_line_2',
        headerName: 'Line 2',
        type: 'string',
        width: 160,
      },
      {
        field: 'city',
        headerName: 'City',
        type: 'string',
        width: 140,
      },
      {
        field: 'state',
        headerName: 'State',
        type: 'string',
        width: 80,
      },
      {
        field: 'postal_code',
        headerName: 'Postal Code',
        type: 'string',
        width: 110,
      },
    ],
    []
  )

  return (
    <InfoCard
      title="Address"
      icon={<Home />}
      dataGridProps={{
        ...dataGridProps,
        rows: filterConfidentialRows(dataGridProps.rows, true),
      }}
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
    <DataGrid
      {...dataGridProps}
      columns={columns}
      rowHeight={settings.rowHeight}
    />
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

const pickPrimary = <T,>(
  items: T[] | undefined | null,
  isPrimary: (item: T) => boolean
): T | undefined => {
  if (!items || items.length === 0) return undefined
  return items.find(isPrimary) ?? items[0]
}
