import { useMemo, useState } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  IContact,
  IEmail,
  IPhone,
  IAddress,
} from '@/interfaces/ocotillo/IContact'
import { List } from '@refinedev/mui'
import { Card, CardHeader } from '@mui/material'
import { ListPage } from '@/components'
import {
  IGroundwaterLevelObservation,
  IObservation,
} from '@/interfaces/ocotillo/IObservation'
import { CanAccess } from '@refinedev/core'

export const GroundwaterLevelObservationList: React.FC = () => {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  )

  const { dataGridProps } = useDataGrid<IGroundwaterLevelObservation>({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
  })

  const columns = useMemo<GridColDef<IGroundwaterLevelObservation>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      // {
      //   field: 'observation_type',
      //   headerName: 'Observation Type',
      //   type: 'string',
      //   minWidth: 150,
      //   flex: 1,
      // },
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
    <CanAccess>
      <ListPage
        columns={columns}
        dataGridProps={dataGridProps}
        getRowId={(row) => row.id}
      />
    </CanAccess>
  )
}
