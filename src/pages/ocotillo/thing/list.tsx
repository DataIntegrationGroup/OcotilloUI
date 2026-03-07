import { useMemo } from 'react'
import { useDataGrid, ExportButton } from '@refinedev/mui'
import { useExport } from '@refinedev/core'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { ISpring, IWell } from '@/interfaces/ocotillo'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { CreateButton } from '@refinedev/mui'
import { useNavigation } from '@refinedev/core'
import { formatAppDateTime } from '@/utils'
import { Button } from '@mui/material'
import { PictureAsPdf } from '@mui/icons-material'

export const SpringList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ISpring>({
    resource: 'thing/spring',
    dataProviderName: 'ocotillo',
  })

  const columns = useMemo<GridColDef<ISpring>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'spring_type',
        headerName: 'Spring Type',
        type: 'string',
        minWidth: 150,
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
      title="Springs"
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description={
        'Springs are natural water sources that flow from the ground. They can be used for various purposes, including water supply and ecological studies.'
      }
    />
  )
}

export const WellList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
  })

  const { triggerExport, isLoading: exportIsLoading } = useExport({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_type: ['water well', 'geothermal well'],
      },
    },
  })

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'well_depth',
        headerName: 'Well Depth (ft)',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'hole_depth',
        headerName: 'Hole Depth (ft)',
        type: 'string',
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

  const { push } = useNavigation()

  const customHeaderButtons = () => {
    return (
      <>
        <CreateButton onClick={() => push('/ocotillo/well-inventory-form')} />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PictureAsPdf />}
          onClick={() => push('/ocotillo/well/batch-export')}
        >
          Batch Field Sheets
        </Button>
        <ExportButton
          variant={'contained'}
          loading={exportIsLoading}
          onClick={triggerExport}
        />
      </>
    )
  }

  return (
    <ListPage
      title="Wells"
      description={
        'A water well is a man-made structure created to access groundwater from underground aquifers. Wells are' +
        ' commonly used for drinking water, irrigation, and industrial purposes, and can vary in depth and' +
        ' construction depending on the local geology and intended use.'
      }
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      headerButtons={customHeaderButtons}
    />
  )
}
