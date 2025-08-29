import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { IContact } from '@/interfaces/ocotillo/IContact'
import { ListPage } from '@/components'
import {
  IGroundwaterLevelObservation,
  IObservation,
} from '@/interfaces/ocotillo/IObservation'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { CanAccess } from '@refinedev/core'

export const GroundwaterLevelObservationList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IGroundwaterLevelObservation>({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
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
    <CanAccess>
      <ListPage
        description={'Groundwater Level Observations'}
        columns={columns}
        dataGridProps={dataGridProps}
        getRowId={(row) => row.id}
      />
    </CanAccess>
  )
}
