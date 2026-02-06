import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { IAsset } from '@/interfaces/ocotillo/IAsset'
import { ListPage } from '@/components'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { formatAppDateTime } from '@/utils'

export const AssetList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IAsset>({
    resource: 'asset',
    dataProviderName: 'ocotillo',

    // it would be great to use staleTime and cacheTime here, but it seems
    // that when staleTime is set, the data is not refetched when the component is remounted
    // after editing a record.

    // queryOptions: {
    //   cacheTime: 60000, // Cache for 1 minute
    // staleTime: 30000, // Consider data fresh for 30 seconds
    // },
  })

  const columns = useMemo<GridColDef<IAsset>[]>(
    () => [
      idColumnDef(),
      {
        field: 'label',
        headerName: 'Label',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'storage_path',
        headerName: 'Storage Path',
        type: 'string',
        minWidth: 350,
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

  return (
    <ListPage
      title={'Assets / Attachments'}
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description={
        'Assets are digital files (.e.g PDFs and images) that are associated with "Things"'
      }
    />
  )
}
