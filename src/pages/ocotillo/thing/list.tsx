import { useEffect, useMemo, useState } from 'react'
import { useExport, useGo, useLink } from '@refinedev/core'
import { ExportButton, useDataGrid } from '@refinedev/mui'
import { GridColDef, GridFilterModel } from '@mui/x-data-grid'
import { captureEvent } from '@/analytics/posthog'
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
  useEffect(() => {
    captureEvent('feature_used', { feature: 'wells_list' })
  }, [])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const { dataGridProps } = useDataGrid<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        include_contacts: true,
        ...(search ? { query: search } : {}),
      },
    },
    pagination: { pageSize: 50 },
  })

  const handleFilterModelChange = (model: GridFilterModel) => {
    const activeFilters = model.items.filter((f) => f.value !== undefined)
    if (activeFilters.length > 0) {
      captureEvent('feature_used', {
        feature: 'wells_filter',
        filter_count: activeFilters.length,
        filter_fields: activeFilters.map((f) => f.field),
      })
    }
    dataGridProps.onFilterModelChange?.(model)
  }

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

  const Link = useLink()

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        description:
          'Official well identifier used in bureau records (for example county prefix and local ID).',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'site_name',
        headerName: 'Site name',
        description:
          'Name of the monitoring site or facility associated with this well when one is recorded.',
        type: 'string',
        minWidth: 140,
        flex: 0.9,
        valueGetter: (_: unknown, row: IWell) => row.site_name ?? '',
      },
      {
        field: 'monitoring_status',
        headerName: 'Monitoring',
        description:
          'Whether the well is actively monitored or how monitoring is categorized in the current record.',
        type: 'string',
        width: 160,
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        description:
          'Date and time this well record was first created in Ocotillo.',
        width: 180,
        valueGetter: (v: string) => formatAppDateTime(v),
      },
      {
        field: 'well_status',
        headerName: 'Well Status',
        description: 'Operational or administrative status of the well.',
        type: 'string',
        width: 150,
      },
      {
        field: 'thing_type',
        headerName: 'Type',
        description:
          'Infrastructure type from the controlled vocabulary (for example water well or geothermal well).',
        type: 'string',
        width: 130,
      },
      {
        field: 'aquifers',
        headerName: 'Aquifers',
        description:
          'Aquifer systems linked to this well, summarized from association data.',
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
        description:
          'Whether the record is released for public viewing under data release rules.',
        type: 'string',
        width: 130,
      },
      {
        field: 'well_depth',
        headerName: 'Well Depth (ft)',
        description:
          'Completed well depth from ground surface to bottom of the well in feet.',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'hole_depth',
        headerName: 'Hole Depth (ft)',
        description:
          'Total drilled hole depth from ground surface to bottom of the borehole in feet.',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'first_visit_date',
        headerName: 'First Visit',
        description:
          'Date of the bureau first recorded visit to this well when available.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'contacts',
        headerName: 'Contacts',
        description:
          'People or organizations linked to this well; open a contact from the link.',
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
        description: 'Reported date the well construction was completed.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'well_driller_name',
        headerName: 'Driller',
        description: 'Drilling company name when it was recorded for this well.',
        type: 'string',
        minWidth: 150,
        flex: 1,
      },
      {
        field: 'latitude',
        headerName: 'Latitude',
        description:
          'Latitude of the current mapped location in decimal degrees (WGS84).',
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
        description:
          'Longitude of the current mapped location in decimal degrees (WGS84).',
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
        description:
          'Identifiers from other agencies or programs that cross reference this well.',
        minWidth: 160,
        flex: 1,
        sortable: false,
        valueGetter: (_: unknown, row: IWell) =>
          row.alternate_ids
            ?.map((a) => `${a.alternate_organization}: ${a.alternate_id}`)
            .join(', ') ?? '',
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
      dataGridProps={{
        ...dataGridProps,
        onFilterModelChange: handleFilterModelChange,
      }}
      getRowId={(row) => row.id}
      headerButtons={customHeaderButtons}
      searchMode="server"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
    />
  )
}
