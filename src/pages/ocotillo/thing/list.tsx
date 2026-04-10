import { useMemo } from 'react'
import { useExport, useGo, useLink, useNavigation } from '@refinedev/core'
import { ExportButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { Button } from '@mui/material'
import { PictureAsPdf } from '@mui/icons-material'
import { ListPage } from '@/components/ListPage'
import { ISpring, IWell } from '@/interfaces/ocotillo'
import { formatAppDate, formatAppDateTime } from '@/utils'

export const SpringList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ISpring>({
    resource: 'thing/spring',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 50 },
  })

  const columns = useMemo<GridColDef<ISpring>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        width: 140,
      },
      {
        field: 'spring_type',
        headerName: 'Spring Type',
        type: 'string',
        width: 140,
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        width: 180,
        valueGetter: (isoDate: string) => formatAppDateTime(isoDate),
      },
    ],
    []
  )

  return (
    <ListPage
      title="Springs"
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description="Springs are natural water sources that flow from the ground. They can be used for various purposes, including water supply and ecological studies."
    />
  )
}

export const WellList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        include_contacts: true,
      },
    },
    pagination: { pageSize: 50 },
  })

  const { triggerExport, isLoading: exportIsLoading } = useExport({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_type: ['water well', 'geothermal well'],
        include_contacts: true,
      },
    },
  })

  const { create } = useNavigation()
  const Link = useLink()

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'well_status',
        headerName: 'Well Status',
        type: 'string',
        width: 150,
      },
      {
        field: 'monitoring_status',
        headerName: 'Monitoring',
        type: 'string',
        width: 160,
      },
      {
        field: 'thing_type',
        headerName: 'Type',
        type: 'string',
        width: 130,
      },
      {
        field: 'aquifers',
        headerName: 'Aquifers',
        minWidth: 180,
        flex: 1,
        sortable: false,
        valueGetter: (_: unknown, row: IWell) =>
          row.aquifers
            ?.map(
              (a: { aquifer_system: string; aquifer_types: string[] }) =>
                a.aquifer_system
            )
            .join(', ') ?? '',
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        width: 130,
      },
      {
        field: 'well_depth',
        headerName: 'Well Depth (ft)',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'hole_depth',
        headerName: 'Hole Depth (ft)',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'first_visit_date',
        headerName: 'First Visit',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'contacts',
        headerName: 'Contacts',
        minWidth: 180,
        flex: 1,
        sortable: false,
        valueGetter: (_: unknown, row: IWell) =>
          row.contacts?.map((c) => c.name ?? '').join(', ') ?? '',
        renderCell: (params) => {
          const contacts = params.row.contacts ?? []
          return (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {contacts.map((contact, idx) => (
                <span key={contact?.id}>
                  {idx > 0 && ', '}
                  <Link
                    go={{
                      to: {
                        resource: 'ocotillo.contact',
                        action: 'show',
                        id: contact.id,
                      },
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contact.name}
                  </Link>
                </span>
              ))}
            </div>
          )
        },
      },
      {
        field: 'well_completion_date',
        headerName: 'Completed',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'well_driller_name',
        headerName: 'Driller',
        type: 'string',
        minWidth: 150,
        flex: 1,
      },
      {
        field: 'latitude',
        headerName: 'Latitude',
        type: 'number',
        width: 110,
        sortable: false,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_: unknown, row: IWell) =>
          row.current_location?.geometry?.coordinates[1] ?? null,
      },
      {
        field: 'longitude',
        headerName: 'Longitude',
        type: 'number',
        width: 110,
        sortable: false,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_: unknown, row: IWell) =>
          row.current_location?.geometry?.coordinates[0] ?? null,
      },
      {
        field: 'alternate_ids',
        headerName: 'Alternate IDs',
        minWidth: 160,
        flex: 1,
        sortable: false,
        valueGetter: (_: unknown, row: IWell) =>
          row.alternate_ids
            ?.map((a) => `${a.alternate_organization}: ${a.alternate_id}`)
            .join(', ') ?? '',
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        width: 180,
        valueGetter: (v: string) => formatAppDateTime(v),
      },
    ],
    []
  )

  const go = useGo()

  const customHeaderButtons = () => {
    return (
      <>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PictureAsPdf />}
          onClick={() =>
            go({ to: '/ocotillo/well/batch-export', type: 'push' })
          }
        >
          Batch Field Sheets
        </Button>
        <ExportButton
          variant="contained"
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
