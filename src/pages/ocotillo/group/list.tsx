import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridCheckCircleIcon, GridColDef } from '@mui/x-data-grid'
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
        minWidth: 150,
      },
      {
        field: 'parent_group_id',
        headerName: 'Parent Group ID',
        type: 'string',
        minWidth: 175,
      },
      {
        field: 'project_area',
        headerName: 'Project Area',
        type: 'string',
        minWidth: 150,
        renderCell: (params) => {
          return params.value ? <GridCheckCircleIcon color="primary" /> : null
        },
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        minWidth: 200,
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
