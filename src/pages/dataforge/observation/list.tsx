import { useMemo, useState } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { IContact } from '@/interfaces/dataforge/IContact'
import { ListPage } from '@/components'
import {
  IGroundwaterLevelObservation,
  IObservation,
} from '@/interfaces/dataforge/IObservation'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'

export const GroundwaterLevelObservationList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IGroundwaterLevelObservation>({
    resource: 'observation/groundwater-level',
    dataProviderName: 'dataforge',
  })

  const columns = useMemo<GridColDef<IGroundwaterLevelObservation>[]>(
    () => [
      idColumnDef(),
      {
        field: 'observation_datetime',
        headerName: 'Observation Date/Time',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => new Date(params),
      },
      {
        field: 'depth_to_water',
        headerName: 'Depth to Water (ft)',
        type: 'number',
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
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
    />
  )
}
