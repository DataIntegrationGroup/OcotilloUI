import { type BaseRecord, useLink, useList, useTable } from '@refinedev/core'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { captureEvent } from '@/analytics/posthog'
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  useRefineDataTable,
} from '@/components/DataTable'
import { ListPageShell } from '@/components/ListPageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAccessCapabilities } from '@/hooks'
import {
  IAddress,
  IContact,
  IEmail,
  IPhone,
} from '@/interfaces/ocotillo/IContact'
import {
  filterConfidentialRows,
  formatAppDateTime,
  formatPhone,
  sanitizeContacts,
} from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'

/**
 * Contacts list. Rows select rather than navigate: selecting a contact opens
 * the email, phone and address cards below the table for anyone cleared to see
 * confidential details, and the name cell links through to the contact page.
 */

const CONTACTS_PAGE_SIZE = 50
const NO_VALUE = '—'

const pickPrimary = <T,>(
  items: T[] | undefined | null,
  isPrimary: (item: T) => boolean
): T | undefined => {
  if (!items || items.length === 0) return undefined
  return items.find(isPrimary) ?? items[0]
}

export const ContactList: React.FC = () => {
  useEffect(() => {
    captureEvent('feature_used', { feature: 'contacts_list' })
  }, [])

  const { canViewConfidential } = useAccessCapabilities()
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  )

  const Link = useLink()

  const refineTable = useTable<IContact>({
    pagination: { pageSize: CONTACTS_PAGE_SIZE },
  })

  const visibleContacts = useMemo(
    () => sanitizeContacts(refineTable.result.data, canViewConfidential),
    [canViewConfidential, refineTable.result.data]
  )

  const columns = useMemo<ColumnDef<IContact, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (contact) => getContactDisplayName(contact),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row, getValue }) => (
          <Link
            go={{
              to: {
                resource: 'ocotillo.contact',
                action: 'show',
                id: row.original.id,
              },
            }}
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) =>
              event.stopPropagation()
            }
          >
            {(getValue() as string) || NO_VALUE}
          </Link>
        ),
        meta: {
          label: 'Name',
          cellClassName: 'font-medium',
          filter: { type: 'text' },
        },
      },
      {
        id: 'organization',
        accessorFn: (contact) => contact.organization ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Organization" />
        ),
        meta: { label: 'Organization', filter: { type: 'text' } },
      },
      {
        id: 'role',
        accessorFn: (contact) => contact.role ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        meta: { label: 'Role', filter: { type: 'text' } },
      },
      {
        id: 'contact_type',
        accessorFn: (contact) => contact.contact_type ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contact Type" />
        ),
        meta: { label: 'Contact Type', filter: { type: 'text' } },
      },
      {
        id: 'primary_phone',
        accessorFn: (contact) =>
          pickPrimary(contact.phones, (phone) => phone.phone_type === 'Primary')
            ?.phone_number ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Primary Phone" />
        ),
        // Sorting and filtering are not offered: the value is derived from the
        // phone list, which the API does not sort or filter on.
        enableSorting: false,
        cell: ({ getValue }) => {
          if (!canViewConfidential) return null
          const value = getValue() as string
          return value ? formatPhone(value) : null
        },
        meta: { label: 'Primary Phone' },
      },
      {
        id: 'primary_email',
        accessorFn: (contact) =>
          pickPrimary(contact.emails, (email) => email.email_type === 'Primary')
            ?.email ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Primary Email" />
        ),
        enableSorting: false,
        cell: ({ getValue }) =>
          canViewConfidential ? ((getValue() as string) ?? null) : null,
        meta: { label: 'Primary Email' },
      },
      {
        id: 'things',
        accessorFn: (contact) =>
          contact.things?.map((thing) => thing.name).join('; ') ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Associated Sites" />
        ),
        cell: ({ row }) => {
          const things = row.original.things ?? []
          if (things.length === 0) return NO_VALUE

          return (
            <div className="flex flex-wrap items-center">
              {things.map((thing, index) => (
                <span key={thing.id}>
                  {index > 0 && ', '}
                  <Link
                    go={{
                      to: {
                        resource: 'ocotillo.thing-well',
                        action: 'show',
                        id: thing.id,
                      },
                    }}
                    onClick={(event: React.MouseEvent<HTMLAnchorElement>) =>
                      event.stopPropagation()
                    }
                  >
                    {thing.name}
                  </Link>
                </span>
              ))}
            </div>
          )
        },
        meta: {
          label: 'Associated Sites',
          description:
            'Monitoring sites linked to this contact. Sort uses the alphabetically first linked site name.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'created_at',
        accessorFn: (contact) => contact.created_at,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ getValue }) => formatAppDateTime(getValue() as string),
        meta: {
          label: 'Created At',
          filter: { type: 'date', defaultOperator: 'gte' },
        },
      },
    ],
    [Link, canViewConfidential]
  )

  const tableOptions = useRefineDataTable<IContact>({
    refineTable,
    columns,
    analyticsPrefix: 'contacts',
  })

  const table = useReactTable({
    data: visibleContacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (contact) => String(contact.id),
    ...tableOptions,
  })

  return (
    <ListPageShell title="Contacts & Owners" accessResource="ocotillo.contact">
      <DataTableToolbar
        table={table}
        summary={
          refineTable.result.total !== undefined
            ? `${refineTable.result.total.toLocaleString()} total records`
            : undefined
        }
      />

      <DataTable
        table={table}
        isLoading={refineTable.tableQuery.isLoading}
        emptyMessage="No contacts match these filters."
        isRowSelected={(contact) => contact.id === selectedContactId}
        onRowClick={(contact) => {
          setSelectedContactId(contact.id)
          captureEvent('contacts_row_clicked', { contact_id: contact.id })
        }}
      />

      <DataTablePagination table={table} />

      {selectedContactId && canViewConfidential ? (
        <div className="flex flex-col gap-4">
          <EmailInfoCard contactId={selectedContactId} />
          <PhoneInfoCard contactId={selectedContactId} />
          <AddressInfoCard contactId={selectedContactId} />
        </div>
      ) : null}
    </ListPageShell>
  )
}

/** Small client-side table for the per-contact detail cards. */
function DetailTable<TData>({
  rows,
  columns,
  isLoading,
  emptyMessage,
}: {
  rows: TData[]
  columns: ColumnDef<TData, unknown>[]
  isLoading: boolean
  emptyMessage: string
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      skeletonRowCount={3}
    />
  )
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/** Contact detail lists are short; one page covers them. */
const DETAIL_PAGE_SIZE = 100

function useContactDetail<
  TData extends BaseRecord & { release_status?: string | null },
>(contactId: number, path: string) {
  const { result, query } = useList<TData>({
    resource: `contact/${contactId}/${path}`,
    dataProviderName: 'ocotillo',
    pagination: { pageSize: DETAIL_PAGE_SIZE },
  })

  return { rows: result?.data ?? [], isLoading: query.isLoading }
}

const EmailInfoCard = ({ contactId }: { contactId: number }) => {
  const { rows, isLoading } = useContactDetail<IEmail>(contactId, 'email')

  const columns = useMemo<ColumnDef<IEmail, unknown>[]>(
    () => [
      {
        id: 'email_type',
        accessorFn: (email) => email.email_type,
        header: 'Type',
        meta: { label: 'Type', headClassName: 'w-36' },
      },
      {
        id: 'email',
        accessorFn: (email) => email.email,
        header: 'Email',
        meta: { label: 'Email' },
      },
    ],
    []
  )

  return (
    <InfoCard title="Email" icon={<MailIcon className="size-4" aria-hidden />}>
      <DetailTable
        rows={filterConfidentialRows(rows, true)}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No email addresses recorded."
      />
    </InfoCard>
  )
}

const PhoneInfoCard = ({ contactId }: { contactId: number }) => {
  const { rows, isLoading } = useContactDetail<IPhone>(contactId, 'phone')

  const columns = useMemo<ColumnDef<IPhone, unknown>[]>(
    () => [
      {
        id: 'phone_type',
        accessorFn: (phone) => phone.phone_type,
        header: 'Type',
        meta: { label: 'Type', headClassName: 'w-36' },
      },
      {
        id: 'phone_number',
        accessorFn: (phone) => phone.phone_number,
        header: 'Phone',
        cell: ({ getValue }) => formatPhone(getValue() as string),
        meta: { label: 'Phone' },
      },
    ],
    []
  )

  return (
    <InfoCard title="Phone" icon={<PhoneIcon className="size-4" aria-hidden />}>
      <DetailTable
        rows={filterConfidentialRows(rows, true)}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No phone numbers recorded."
      />
    </InfoCard>
  )
}

const AddressInfoCard = ({ contactId }: { contactId: number }) => {
  const { rows, isLoading } = useContactDetail<IAddress>(contactId, 'address')

  const columns = useMemo<ColumnDef<IAddress, unknown>[]>(
    () => [
      {
        id: 'address_type',
        accessorFn: (address) => address.address_type,
        header: 'Type',
        meta: { label: 'Type', headClassName: 'w-32' },
      },
      {
        id: 'address_line_1',
        accessorFn: (address) => address.address_line_1,
        header: 'Address',
        meta: { label: 'Address' },
      },
      {
        id: 'address_line_2',
        accessorFn: (address) => address.address_line_2 ?? '',
        header: 'Line 2',
        meta: { label: 'Line 2' },
      },
      {
        id: 'city',
        accessorFn: (address) => address.city,
        header: 'City',
        meta: { label: 'City' },
      },
      {
        id: 'state',
        accessorFn: (address) => address.state,
        header: 'State',
        meta: { label: 'State', headClassName: 'w-20' },
      },
      {
        id: 'postal_code',
        accessorFn: (address) => address.postal_code,
        header: 'Postal Code',
        meta: { label: 'Postal Code', headClassName: 'w-32' },
      },
    ],
    []
  )

  return (
    <InfoCard
      title="Address"
      icon={<MapPinIcon className="size-4" aria-hidden />}
    >
      <DetailTable
        rows={filterConfidentialRows(rows, true)}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No addresses recorded."
      />
    </InfoCard>
  )
}
