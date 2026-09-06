import { GridColDef } from '@mui/x-data-grid'
import {
  type CrudFilter,
  useExport,
  useGo,
  useOne,
  useTable,
} from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Download, FileText, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  captureEvent,
  consumeWellsProjectFilterSource,
} from '@/analytics/posthog'
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  useRefineDataTable,
} from '@/components/DataTable'
import { ListPage } from '@/components/ListPage'
import { ListPageShell } from '@/components/ListPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ISpring, IWell } from '@/interfaces/ocotillo'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import { useWellListColumns } from '@/pages/ocotillo/thing/wellListColumns'
import { formatAppDateTime } from '@/utils'
import { buildWellShowPath } from '@/utils/wellPublicUrls'

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

const WELLS_PAGE_SIZE = 50

/**
 * Wells list. Uses the shadcn DataTable over Refine's `useTable`: paging,
 * sorting and column filtering all run server side, so the toolbar controls
 * describe the whole collection rather than the loaded page.
 */
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

  const refineTable = useTable<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    filters: {
      permanent: projectFilters,
    },
    // Most recently added records first. The API exposes no update timestamp
    // on wells, so `created_at` is the closest thing to "last updated".
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
    meta: {
      params: {
        include_contacts: true,
        ...(search ? { name_contains: search } : {}),
      },
    },
    pagination: { pageSize: WELLS_PAGE_SIZE },
  })

  const { setFilters, setCurrentPage, tableQuery, result } = refineTable

  // A new search describes a different collection, so start at its first page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: search is the trigger
  useEffect(() => {
    setCurrentPage(1)
  }, [search, setCurrentPage])

  const prevProjectIdRef = useRef<string | null>(null)

  // Refine seeds its filter state with the permanent filters. Dropping the URL
  // project filter therefore leaves a stale `groups` filter behind unless the
  // state is reset alongside it.
  useEffect(() => {
    if (prevProjectIdRef.current && !projectId) {
      setFilters([], 'replace')
    }
    prevProjectIdRef.current = projectId
  }, [projectId, setFilters])

  const columns = useWellListColumns()

  const tableOptions = useRefineDataTable<IWell>({
    refineTable,
    columns,
    permanentFilters: projectFilters,
    analyticsPrefix: 'wells',
  })

  const table = useReactTable({
    data: result.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (well) => String(well.id),
    ...tableOptions,
  })

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

  const go = useGo()

  const headerButtons = (
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
        {exportIsLoading ? <Loader2 className="animate-spin" /> : <Download />}
        Export
      </Button>
    </>
  )

  const projectChip = projectId ? (
    <Badge variant="filter" className="h-7 gap-1 py-0 pl-2.5 pr-1" asChild>
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
  ) : null

  return (
    <ListPageShell
      title="Wells"
      accessResource="ocotillo.thing-well"
      headerButtons={headerButtons}
    >
      <DataTableToolbar
        table={table}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by well name"
        searchAriaLabel="Search wells by well name"
        leadingChips={projectChip}
        summary={
          result.total !== undefined
            ? `${result.total.toLocaleString()} total records`
            : undefined
        }
      />

      <DataTable
        table={table}
        isLoading={tableQuery.isLoading}
        emptyMessage="No wells match these filters."
        rowHref={(well) => buildWellShowPath(well.id)}
        onRowClick={(well) =>
          captureEvent('wells_row_clicked', { well_id: well.id })
        }
      />

      <DataTablePagination table={table} />
    </ListPageShell>
  )
}
