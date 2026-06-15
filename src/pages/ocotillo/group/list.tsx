import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridCheckCircleIcon, GridColDef } from '@mui/x-data-grid'
import { Chip } from '@mui/material'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import { ListPage } from '@/components'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { formatAppDateTime } from '@/utils'

export const GroupList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
  })

  const columns = useMemo<GridColDef<IGroup>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 200,
        flex: 1,
      },
      {
        field: 'description',
        headerName: 'Description',
        type: 'string',
        minWidth: 250,
        flex: 2,
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
        field: 'well_count',
        headerName: 'Wells',
        type: 'number',
        width: 80,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'parent_group_id',
        headerName: 'Parent Group',
        type: 'string',
        width: 130,
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
        width: 180,
        valueGetter: (isoDate: string) => formatAppDateTime(isoDate),
      },
      actionColumnDef(),
    ],
    []
  )

  const DESCRIPTION = `
    Groups are used to organize things and other groups. For example,
    you can create a group called "Collaborative Network" and add all
    the wells in the network to that group.
  `

  return (
    <ListPage
      title={'Groups / Projects'}
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description={DESCRIPTION}
    />
  )
}
