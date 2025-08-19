import { ListPage } from '@/components'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { useMemo } from 'react'
import { IThingIdLink } from '@/interfaces/ocotillo/IThing'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { extractThingTypeResource, linkColumn } from '@/utils/link'

export const ThingIdLinkList = () => {
  const { dataGridProps } = useDataGrid({
    resource: 'thing/id-link',
    dataProviderName: 'ocotillo',
  })

  const columns = useMemo<GridColDef<IThingIdLink>[]>(
    () => [
      idColumnDef(),
      linkColumn(
        extractThingTypeResource((params) => params.row.thing.thing_type),
        {
          field: 'thing_id',
          headerName: 'Thing ID',
          type: 'string',
          minWidth: 150,
        }
      ),
      {
        field: 'thing',
        headerName: 'Thing Name',
        type: 'string',
        minWidth: 150,
        valueGetter: (value, row) => {
          return row.thing.name
        },
      },
      {
        field: 'thing_type',
        headerName: 'Thing Type',
        type: 'string',
        minWidth: 150,
        valueGetter: (value, row) => {
          return row.thing.thing_type
        },
      },
      {
        field: 'relation',
        headerName: 'Relationship',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'alternate_id',
        headerName: 'Alternate ID',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'alternate_organization',
        headerName: 'Alternate Organization',
        type: 'string',
        minWidth: 150,
      },
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
  return (
    <ListPage
      getRowId={(row) => row.id}
      columns={columns}
      dataGridProps={dataGridProps}
      description={'ThingIdLink List'}
    />
  )
}
