/**
 * Projects list — same ListPage template as WellList in ../list.tsx.
 * Copy that file when adding new wells-area list pages.
 */
import { useEffect, useMemo } from 'react'
import { type CrudFilter } from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { captureEvent, setWellsProjectFilterSource } from '@/analytics/posthog'
import { ListPage } from '@/components/ListPage'
import { useListPageDataGridAnalytics } from '@/hooks'
import { IGroup } from '@/interfaces/ocotillo/IGroup'

// Provisional — update after team decision in OcotilloAPI PR (BDMS-876).
const PROJECT_LIST_FILTERS: CrudFilter[] = [
  { field: 'group_type', operator: 'ne', value: 'Geographic Area' },
  { field: 'group_type', operator: 'ne', value: 'Historical' },
]

export const WellProjectList: React.FC = () => {
  useEffect(() => {
    captureEvent('feature_used', { feature: 'projects_list' })
  }, [])

  const { dataGridProps } = useDataGrid<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 50 },
    filters: {
      permanent: PROJECT_LIST_FILTERS,
    },
  })

  const dataGridPropsWithAnalytics = useListPageDataGridAnalytics(
    dataGridProps,
    'projects'
  )

  const columns = useMemo<GridColDef<IGroup>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 180,
        flex: 1,
      },
      {
        field: 'well_count',
        headerName: 'Wells',
        type: 'number',
        width: 100,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'description',
        headerName: 'Description',
        type: 'string',
        minWidth: 220,
        flex: 1.2,
        valueGetter: (_: unknown, row: IGroup) => row.description?.trim() || '—',
      },
    ],
    []
  )

  return (
    <ListPage
      title="Projects"
      columns={columns}
      dataGridProps={dataGridPropsWithAnalytics}
      getRowId={(row) => row.id}
      hideBreadcrumb
      hideHeaderButtons
      getRowHref={(params) => `/ocotillo/well?projectId=${params.id}`}
      onRowClick={(params) => {
        setWellsProjectFilterSource('projects_list')
        captureEvent('projects_row_clicked', {
          project_id: params.id,
          project_name: params.row.name,
        })
      }}
    />
  )
}
