import { useLink } from '@refinedev/core'
import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router'
import { captureEvent, setWellsProjectFilterSource } from '@/analytics/posthog'
import { DataTableColumnHeader } from '@/components/DataTable'
import type { IWell } from '@/interfaces/ocotillo'
import { displayWellSiteName, formatAppDate } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import { buildWellShowPath } from '@/utils/wellPublicUrls'
import { WellListColumnLabels } from '@/well-list/wellListColumnLabels'

/**
 * Column definitions for the wells list. Column ids match the API field names
 * so sorting and filtering can be handed straight to the server; columns the
 * API cannot sort on (coordinates, alternate ids) opt out.
 */

const NO_VALUE = '—'

export function useWellListColumns(): ColumnDef<IWell, unknown>[] {
  // Contact links go through Refine so the contact route stays resource-aware.
  const Link = useLink()

  return useMemo(
    () => [
      {
        id: 'open_in_new_window',
        header: () => <span className="sr-only">Open in new window</span>,
        enableSorting: false,
        enableHiding: false,
        meta: {
          label: 'Open in new window',
          description:
            'Open this well detail page in a new browser window so several wells can stay open at once.',
          headClassName: 'w-[52px]',
          // Drop the cell padding so the link can cover the full cell.
          cellClassName: 'relative !p-0',
        },
        // The link fills the whole cell so the entire column is the hit target,
        // not just the icon glyph.
        cell: ({ row }) => (
          <RouterLink
            to={buildWellShowPath(row.original.id)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${row.original.name ?? 'well'} in a new window`}
            title="Open in new window"
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
              event.stopPropagation()
              captureEvent('wells_opened_new_window', {
                well_id: row.original.id,
              })
            }}
            className="absolute inset-0 flex items-center justify-center text-muted-foreground hover:bg-primary/5 hover:text-primary"
          >
            <ExternalLink className="size-4" />
          </RouterLink>
        ),
      },
      {
        id: 'name',
        accessorFn: (well) => well.name,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.name}
          />
        ),
        meta: {
          label: WellListColumnLabels.name,
          description:
            'Official well identifier used in bureau records (for example county prefix and local ID).',
          filter: { type: 'text' },
          cellClassName: 'font-medium',
        },
      },
      {
        id: 'site_name',
        accessorFn: (well) => displayWellSiteName(well),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.siteName}
          />
        ),
        meta: {
          label: WellListColumnLabels.siteName,
          description:
            'Name of the monitoring site or facility associated with this well when one is recorded (NMBGMR alternate ID when present).',
          filter: { type: 'text' },
        },
      },
      {
        id: 'monitoring_status',
        accessorFn: (well) => well.monitoring_status ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.monitoring}
          />
        ),
        meta: {
          label: WellListColumnLabels.monitoring,
          description:
            'Whether the well is actively monitored or how monitoring is categorized in the current record.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'created_at',
        accessorFn: (well) => well.created_at,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.createdAt}
          />
        ),
        cell: ({ getValue }) => formatAppDate(getValue() as string),
        meta: {
          label: WellListColumnLabels.createdAt,
          description:
            'Calendar date when this well record was first added to Ocotillo.',
          filter: { type: 'date', defaultOperator: 'gte' },
        },
      },
      {
        id: 'well_status',
        accessorFn: (well) => well.well_status ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.wellStatus}
          />
        ),
        meta: {
          label: WellListColumnLabels.wellStatus,
          description: 'Operational or administrative status of the well.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'thing_type',
        accessorFn: (well) => well.thing_type,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.type}
          />
        ),
        meta: {
          label: WellListColumnLabels.type,
          description:
            'Infrastructure type from the controlled vocabulary (for example water well or geothermal well).',
          filter: {
            type: 'select',
            options: [
              { label: 'Water well', value: 'water well' },
              { label: 'Geothermal well', value: 'geothermal well' },
            ],
          },
        },
      },
      {
        id: 'aquifers',
        accessorFn: (well) =>
          well.aquifers?.map((aquifer) => aquifer.aquifer_system).join(', ') ??
          '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.aquifers}
          />
        ),
        meta: {
          label: WellListColumnLabels.aquifers,
          description:
            'Aquifer systems linked to this well, summarized from association data. Sort uses the first aquifer name alphabetically among linked systems.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'groups',
        accessorFn: (well) =>
          well.groups?.map((group) => group.name).join(', ') ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.projects}
          />
        ),
        cell: ({ row }) => {
          const groups = row.original.groups ?? []
          if (groups.length === 0) return NO_VALUE

          return (
            <div className="flex flex-wrap items-center">
              {groups.map((group, index) => (
                <span key={group.id}>
                  {index > 0 && ', '}
                  <RouterLink
                    to={`/ocotillo/well?projectId=${group.id}`}
                    onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                      event.stopPropagation()
                      setWellsProjectFilterSource('wells_column')
                      captureEvent('wells_project_link_clicked', {
                        project_id: group.id,
                        project_name: group.name,
                      })
                    }}
                    className="text-primary no-underline hover:underline"
                  >
                    {group.name}
                  </RouterLink>
                </span>
              ))}
            </div>
          )
        },
        meta: {
          label: WellListColumnLabels.projects,
          description:
            'Projects linked to this well. A well may belong to more than one. Filter matches any linked project name. Sort uses the alphabetically first project name.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'release_status',
        accessorFn: (well) => well.release_status,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.releaseStatus}
          />
        ),
        meta: {
          label: WellListColumnLabels.releaseStatus,
          description:
            'Whether the record is released for public viewing under data release rules.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'well_depth',
        accessorFn: (well) => well.well_depth ?? null,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.wellDepthFt}
          />
        ),
        cell: ({ getValue }) => (getValue() as number | null) ?? NO_VALUE,
        meta: {
          label: WellListColumnLabels.wellDepthFt,
          description:
            'Completed well depth from ground surface to bottom of the well in feet.',
          align: 'right',
          filter: { type: 'number', defaultOperator: 'gte' },
        },
      },
      {
        id: 'hole_depth',
        accessorFn: (well) => well.hole_depth ?? null,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.holeDepthFt}
          />
        ),
        cell: ({ getValue }) => (getValue() as number | null) ?? NO_VALUE,
        meta: {
          label: WellListColumnLabels.holeDepthFt,
          description:
            'Total drilled hole depth from ground surface to bottom of the borehole in feet.',
          align: 'right',
          filter: { type: 'number', defaultOperator: 'gte' },
        },
      },
      {
        id: 'first_visit_date',
        accessorFn: (well) => well.first_visit_date ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.firstVisit}
          />
        ),
        cell: ({ getValue }) => formatAppDate(getValue() as string),
        meta: {
          label: WellListColumnLabels.firstVisit,
          description:
            'Date of the bureau first recorded visit to this well when available.',
          filter: { type: 'date', defaultOperator: 'gte' },
        },
      },
      {
        id: 'contacts',
        accessorFn: (well) =>
          well.contacts
            ?.map((contact) => getContactDisplayName(contact))
            .join(', ') ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.contacts}
          />
        ),
        cell: ({ row }) => {
          const contacts = row.original.contacts ?? []
          if (contacts.length === 0) return NO_VALUE

          return (
            <div className="flex flex-wrap items-center">
              {contacts.map((contact, index) => (
                <span key={contact?.id ?? index}>
                  {index > 0 && ', '}
                  {contact?.id != null ? (
                    <Link
                      go={{
                        to: {
                          resource: 'ocotillo.contact',
                          action: 'show',
                          id: contact.id,
                        },
                      }}
                      onClick={(event: React.MouseEvent<HTMLAnchorElement>) =>
                        event.stopPropagation()
                      }
                    >
                      {getContactDisplayName(contact)}
                    </Link>
                  ) : (
                    getContactDisplayName(contact)
                  )}
                </span>
              ))}
            </div>
          )
        },
        meta: {
          label: WellListColumnLabels.contacts,
          description:
            'People or organizations linked to this well; open a contact from the link. Sort uses the alphabetically first linked contact name.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'well_completion_date',
        accessorFn: (well) => well.well_completion_date ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.completed}
          />
        ),
        cell: ({ getValue }) => formatAppDate(getValue() as string),
        meta: {
          label: WellListColumnLabels.completed,
          description: 'Reported date the well construction was completed.',
          filter: { type: 'date', defaultOperator: 'gte' },
        },
      },
      {
        id: 'well_driller_name',
        accessorFn: (well) => well.well_driller_name ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.driller}
          />
        ),
        meta: {
          label: WellListColumnLabels.driller,
          description:
            'Drilling company name when it was recorded for this well.',
          filter: { type: 'text' },
        },
      },
      {
        id: 'latitude',
        accessorFn: (well) => well.current_location?.geometry?.coordinates[1],
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.latitude}
          />
        ),
        cell: ({ getValue }) => (getValue() as number | undefined) ?? NO_VALUE,
        enableSorting: false,
        meta: {
          label: WellListColumnLabels.latitude,
          description:
            'Latitude of the current mapped location in decimal degrees (WGS84).',
          align: 'right',
        },
      },
      {
        id: 'longitude',
        accessorFn: (well) => well.current_location?.geometry?.coordinates[0],
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.longitude}
          />
        ),
        cell: ({ getValue }) => (getValue() as number | undefined) ?? NO_VALUE,
        enableSorting: false,
        meta: {
          label: WellListColumnLabels.longitude,
          description:
            'Longitude of the current mapped location in decimal degrees (WGS84).',
          align: 'right',
        },
      },
      {
        id: 'alternate_ids',
        accessorFn: (well) =>
          well.alternate_ids
            ?.map(
              (alternate) =>
                `${alternate.alternate_organization}: ${alternate.alternate_id}`
            )
            .join(', ') ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={WellListColumnLabels.alternateIds}
          />
        ),
        enableSorting: false,
        meta: {
          label: WellListColumnLabels.alternateIds,
          description:
            'Identifiers from other agencies or programs that cross reference this well.',
        },
      },
    ],
    [Link]
  )
}
