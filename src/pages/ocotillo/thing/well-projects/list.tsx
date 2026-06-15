/**
 * Projects list — same ListPage template as WellList in ../list.tsx.
 * Copy that file when adding new wells-area list pages.
 */
import { useEffect, useMemo } from 'react'
import { type CrudFilter } from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import { GridCheckCircleIcon, GridColDef } from '@mui/x-data-grid'
import { Chip } from '@mui/material'
import { captureEvent, setWellsProjectFilterSource } from '@/analytics/posthog'
import { ListPage } from '@/components/ListPage'
import { useListPageDataGridAnalytics } from '@/hooks'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import { formatAppDateTime } from '@/utils'

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
        width: 80,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'description',
        headerName: 'Description',
        type: 'string',
        minWidth: 220,
        flex: 1.5,
        valueGetter: (_: unknown, row: IGroup) => row.description?.trim() || '—',
      },
      {
        field: 'group_type',
        headerName: 'Type',
        type: 'string',
        width: 140,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        width: 140,
        renderCell: (params) =>
          params.value ? (
            <Chip label={params.value} size="small" variant="outlined" />
          ) : null,
      },
      {
        field: 'parent_group_id',
        headerName: 'Parent Group',
        type: 'string',
        width: 120,
      },
      {
        field: 'project_area',
        headerName: 'Has Boundary',
        type: 'string',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) =>
          params.value ? <GridCheckCircleIcon color="primary" /> : null,
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        width: 175,
        valueGetter: (isoDate: string) => formatAppDateTime(isoDate),
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
