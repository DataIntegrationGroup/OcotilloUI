import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { formatAppDateTime } from '@/utils'
import { Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { useExport } from '@refinedev/core'
import { useNavigation } from '@refinedev/core'

export const LocationList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ILocation>({
    resource: 'location',
    dataProviderName: 'ocotillo',
  })

  const { triggerExport, isLoading: exportIsLoading } = useExport({
    resource: 'location',
    dataProviderName: 'ocotillo',
  })

  const { create } = useNavigation()

  const columns = useMemo<GridColDef<ILocation>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 100,
        maxWidth: 150,
        flex: 1,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        minWidth: 200,
        valueGetter: (notes: ILocation['notes']) => {
          if (!Array.isArray(notes) || notes.length === 0) {
            return ''
          }

          return notes
            .map((note) => {
              if (!note) return ''
              const type = note.note_type ?? 'Note'
              const content = note.content ?? ''
              return content ? `${type}: ${content}` : type
            })
            .filter(Boolean)
            .join(' • ')
        },
      },
      {
        field: 'point',
        headerName: 'Point (WKT)',
        type: 'string',
        minWidth: 350,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        minWidth: 120,
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

  const customHeaderButtons = () => (
    <>
      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => create('location')}
      >
        Create
      </Button>
      <Button
        size="small"
        variant="contained"
        startIcon={<FileDownloadOutlinedIcon />}
        disabled={exportIsLoading}
        onClick={triggerExport}
      >
        Export
      </Button>
    </>
  )

  return (
    <ListPage
      title="Locations"
      description="Geographic points that anchor monitoring sites. Each location holds coordinate data and release status, and can be associated with one or more monitoring things like wells or springs."
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      headerButtons={customHeaderButtons}
    />
  )
}
