import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router'
import {
  useExport,
  useGo,
  useLink,
  useOne,
  type CrudFilter,
} from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import {
  captureEvent,
  consumeWellsProjectFilterSource,
  setWellsProjectFilterSource,
} from '@/analytics/posthog'
import { Download, FileText, Loader2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListPage } from '@/components/ListPage'
import { useListPageDataGridAnalytics } from '@/hooks'
import { ISpring, IWell } from '@/interfaces/ocotillo'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import { displayWellSiteName, formatAppDate, formatAppDateTime } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import { WellListColumnLabels } from '@/well-list/wellListColumnLabels'

export const SpringList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ISpring>({
    resource: 'thing/spring',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 50 },
  })

  const columns = useMemo<GridColDef<ISpring>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        width: 140,
      },
      {
        field: 'spring_type',
        headerName: 'Spring Type',
        type: 'string',
        width: 140,
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        width: 180,
        valueGetter: (isoDate: string) => formatAppDateTime(isoDate),
      },
    ],
    []
  )

  return (
    <ListPage
      title="Springs"
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description="Springs are natural water sources that flow from the ground. They can be used for various purposes, including water supply and ecological studies."
    />
  )
}

/** Standard ListPage template for Ocotillo resource lists. Copy for new list pages. */
export const WellList: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('projectId')

  useEffect(() => {
    captureEvent('feature_used', {
      feature: projectId ? 'wells_list_project_filtered' : 'wells_list',
      ...(projectId ? { project_id: projectId } : {}),
    })
  }, [projectId])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const projectFilters = useMemo<CrudFilter[]>(
    () =>
      projectId ? [{ field: 'groups', operator: 'eq', value: projectId }] : [],
    [projectId]
  )

  const { query: projectQuery } = useOne({
    resource: 'group',
    id: projectId ?? '',
    dataProviderName: 'ocotillo',
    queryOptions: { enabled: Boolean(projectId) },
  })
  const projectName = (projectQuery?.data?.data as IGroup | undefined)?.name

  useEffect(() => {
    if (!projectId) return

    const source = consumeWellsProjectFilterSource()
    captureEvent('wells_project_filter_applied', {
      project_id: projectId,
      source,
    })
  }, [projectId])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (search) {
      captureEvent('wells_searched', { query_length: search.length })
    }
  }, [search])

  const { dataGridProps, setFilters } = useDataGrid<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    filters: {
      permanent: projectFilters,
    },
    meta: {
      params: {
        include_contacts: true,
        ...(search ? { name_contains: search } : {}),
      },
    },
    pagination: { pageSize: 50 },
  })

  const onFilterModelChangeRef = useRef<
    typeof dataGridProps.onFilterModelChange | undefined
  >(undefined)
  const prevProjectIdRef = useRef<string | null>(null)

  useEffect(() => {
    onFilterModelChangeRef.current = dataGridProps.onFilterModelChange
  }, [dataGridProps.onFilterModelChange])

  // Refine hides permanent filters from the DataGrid filterModel. When the URL
  // project filter is removed, stale groups filters remain in muiCrudFilters
  // and surface as a grid chip unless we reset both Refine and grid state.
  useEffect(() => {
    if (prevProjectIdRef.current && !projectId) {
      setFilters([], 'replace')
      onFilterModelChangeRef.current?.({ items: [] })
    }
    prevProjectIdRef.current = projectId
  }, [projectId, setFilters])

  const dataGridPropsWithAnalytics = useListPageDataGridAnalytics(
    dataGridProps,
    'wells'
  )

  const { triggerExport, isLoading: exportIsLoading } = useExport({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    pageSize: 500,
    meta: {
      params: {
        thing_type: ['water well', 'geothermal well'],
        include_contacts: true,
        ...(search ? { name_contains: search } : {}),
      },
    },
  })

  const Link = useLink()

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'name',
        headerName: WellListColumnLabels.name,
        description:
          'Official well identifier used in bureau records (for example county prefix and local ID).',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'site_name',
        headerName: WellListColumnLabels.siteName,
        description:
          'Name of the monitoring site or facility associated with this well when one is recorded (NMBGMR alternate ID when present).',
        type: 'string',
        minWidth: 140,
        flex: 0.9,
        valueGetter: (_: unknown, row: IWell) => displayWellSiteName(row),
      },
      {
        field: 'monitoring_status',
        headerName: WellListColumnLabels.monitoring,
        description:
          'Whether the well is actively monitored or how monitoring is categorized in the current record.',
        type: 'string',
        width: 160,
      },
      {
        field: 'created_at',
        headerName: WellListColumnLabels.createdAt,
        description:
          'Calendar date when this well record was first added to Ocotillo.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'well_status',
        headerName: WellListColumnLabels.wellStatus,
        description: 'Operational or administrative status of the well.',
        type: 'string',
        width: 150,
      },
      {
        field: 'thing_type',
        headerName: WellListColumnLabels.type,
        description:
          'Infrastructure type from the controlled vocabulary (for example water well or geothermal well).',
        type: 'string',
        width: 130,
      },
      {
        field: 'aquifers',
        headerName: WellListColumnLabels.aquifers,
        description:
          'Aquifer systems linked to this well, summarized from association data. Sort uses the first aquifer name alphabetically among linked systems.',
        minWidth: 180,
        flex: 1,
        valueGetter: (_: unknown, row: IWell) =>
          row.aquifers
            ?.map(
              (a: { aquifer_system: string; aquifer_types: string[] }) =>
                a.aquifer_system
            )
            .join(', ') ?? '',
      },
      {
        field: 'groups',
        headerName: WellListColumnLabels.projects,
        description:
          'Projects linked to this well. A well may belong to more than one. Filter matches any linked project name. Sort uses the alphabetically first project name.',
        type: 'string',
        minWidth: 180,
        flex: 1,
        valueGetter: (_: unknown, row: IWell) =>
          row.groups?.map((group) => group.name).join(', ') ?? '',
        renderCell: (params) => {
          const groups = params.row.groups ?? []
          return (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {groups.map((group, idx) => (
                <span key={group.id}>
                  {idx > 0 && ', '}
                  <RouterLink
                    to={`/ocotillo/well?projectId=${group.id}`}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.stopPropagation()
                      setWellsProjectFilterSource('wells_column')
                      captureEvent('wells_project_link_clicked', {
                        project_id: group.id,
                        project_name: group.name,
                      })
                    }}
                    className="text-primary hover:underline no-underline"
                  >
                    {group.name}
                  </RouterLink>
                </span>
              ))}
            </div>
          )
        },
      },
      {
        field: 'release_status',
        headerName: WellListColumnLabels.releaseStatus,
        description:
          'Whether the record is released for public viewing under data release rules.',
        type: 'string',
        width: 130,
      },
      {
        field: 'well_depth',
        headerName: WellListColumnLabels.wellDepthFt,
        description:
          'Completed well depth from ground surface to bottom of the well in feet.',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'hole_depth',
        headerName: WellListColumnLabels.holeDepthFt,
        description:
          'Total drilled hole depth from ground surface to bottom of the borehole in feet.',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'first_visit_date',
        headerName: WellListColumnLabels.firstVisit,
        description:
          'Date of the bureau first recorded visit to this well when available.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'contacts',
        headerName: WellListColumnLabels.contacts,
        description:
          'People or organizations linked to this well; open a contact from the link. Sort uses the alphabetically first linked contact name.',
        minWidth: 180,
        flex: 1,
        valueGetter: (_: unknown, row: IWell) =>
          row.contacts?.map((c) => getContactDisplayName(c)).join(', ') ?? '',
        renderCell: (params) => {
          const contacts = params.row.contacts ?? []
          return (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {contacts.map((contact, idx) => (
                <span key={contact?.id ?? idx}>
                  {idx > 0 && ', '}
                  {contact?.id != null ? (
                    <Link
                      go={{
                        to: {
                          resource: 'ocotillo.contact',
                          action: 'show',
                          id: contact.id,
                        },
                      }}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                        e.stopPropagation()
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
      },
      {
        field: 'well_completion_date',
        headerName: WellListColumnLabels.completed,
        description: 'Reported date the well construction was completed.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'well_driller_name',
        headerName: WellListColumnLabels.driller,
        description:
          'Drilling company name when it was recorded for this well.',
        type: 'string',
        minWidth: 150,
        flex: 1,
      },
      {
        field: 'latitude',
        headerName: WellListColumnLabels.latitude,
        description:
          'Latitude of the current mapped location in decimal degrees (WGS84).',
        type: 'number',
        width: 110,
        sortable: false,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_: unknown, row: IWell) =>
          row.current_location?.geometry?.coordinates[1] ?? null,
      },
      {
        field: 'longitude',
        headerName: WellListColumnLabels.longitude,
        description:
          'Longitude of the current mapped location in decimal degrees (WGS84).',
        type: 'number',
        width: 110,
        sortable: false,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_: unknown, row: IWell) =>
          row.current_location?.geometry?.coordinates[0] ?? null,
      },
      {
        field: 'alternate_ids',
        headerName: WellListColumnLabels.alternateIds,
        description:
          'Identifiers from other agencies or programs that cross reference this well.',
        minWidth: 160,
        flex: 1,
        sortable: false,
        valueGetter: (_: unknown, row: IWell) =>
          row.alternate_ids
            ?.map((a) => `${a.alternate_organization}: ${a.alternate_id}`)
            .join(', ') ?? '',
      },
    ],
    []
  )

  const go = useGo()

  const customHeaderButtons = () => {
    return (
      <>
        <Button
          variant="outline"
          className="border-primary bg-background text-primary hover:bg-primary/5 hover:text-primary"
          onClick={() => {
            captureEvent('wells_batch_field_sheets')
            go({ to: '/ocotillo/well/batch-export', type: 'push' })
          }}
        >
          <FileText />
          Batch Field Sheets
        </Button>
        <Button
          disabled={exportIsLoading}
          onClick={() => {
            captureEvent('wells_exported', { search_active: Boolean(search) })
            triggerExport()
          }}
        >
          {exportIsLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          Export
        </Button>
      </>
    )
  }

  return (
    <ListPage
      title="Wells"
      columns={columns}
      dataGridProps={dataGridPropsWithAnalytics}
      getRowId={(row) => row.id}
      headerButtons={customHeaderButtons}
      searchMode="server"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search by well name"
      searchAriaLabel="Search wells by well name"
      onRowClick={(params) =>
        captureEvent('wells_row_clicked', { well_id: params.id })
      }
      accessResource="ocotillo.thing-well"
    >
      {projectId ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="filter"
            className="h-7 gap-1 py-0 pl-2.5 pr-1"
            asChild
          >
            <div role="status" className="inline-flex items-center">
              <span>Project: {projectName ?? projectId}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 rounded-full text-primary/70 hover:bg-primary/10 hover:text-primary"
                aria-label="Clear project filter"
                onClick={() => {
                  captureEvent('wells_project_filter_cleared', {
                    project_id: projectId,
                    project_name: projectName,
                  })
                  navigate('/ocotillo/well')
                }}
              >
                <X />
              </Button>
            </div>
          </Badge>
        </div>
      ) : null}
    </ListPage>
  )
}
