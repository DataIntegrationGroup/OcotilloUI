import { useMemo, useState } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  IContact,
  IEmail,
  IPhone,
  IAddress,
} from '@/interfaces/dataforge/IContact'
import { List } from '@refinedev/mui'
import { Card, CardHeader } from '@mui/material'
import { ListPage } from '@/components'
import {
  IGroundwaterLevelObservation,
  IObservation,
} from '@/interfaces/dataforge/IObservation'

export const GroundwaterLevelObservationList: React.FC = () => {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  )

  const { dataGridProps } = useDataGrid<IGroundwaterLevelObservation>({
    resource: 'observation/groundwater-level',
    dataProviderName: 'dataforge',
  })

  const columns = useMemo<GridColDef<IGroundwaterLevelObservation>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'observation_type',
        headerName: 'Observation Type',
        type: 'string',
        minWidth: 150,
        flex: 1,
      },
      {
        field: 'observation_timestamp',
        headerName: 'Observation Timestamp',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => new Date(params),
      },
      {
        field: 'depth_to_water',
        headerName: 'Depth to Water (m)',
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
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.id} />
              <ShowButton hideText recordItemId={row.id} />
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
        flex: 0.3,
      },
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
