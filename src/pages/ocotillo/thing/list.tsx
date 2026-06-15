import { useEffect, useMemo, useState } from 'react'
import { useExport, useGo, useLink } from '@refinedev/core'
import { ExportButton, useDataGrid } from '@refinedev/mui'
import {
  GridCallbackDetails,
  GridColDef,
  GridColumnVisibilityModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid'
import { captureEvent } from '@/analytics/posthog'
import { Button } from '@mui/material'
import { PictureAsPdf } from '@mui/icons-material'
import { ListPage } from '@/components/ListPage'
import { ISpring, IWell } from '@/interfaces/ocotillo'
import { displayWellSiteName, formatAppDate, formatAppDateTime } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import { WellListColumnLabels } from '@/well-list/wellListColumnLabels'

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

  useEffect(() => {
    if (search) {
      captureEvent('wells_searched', { query_length: search.length })
    }
  }, [search])

  const { dataGridProps } = useDataGrid<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        include_contacts: true,
        ...(search ? { name_contains: search } : {}),
      },
    },
    pagination: { pageSize: 50 },
  })

  const handleFilterModelChange = (
    model: GridFilterModel,
    details: GridCallbackDetails
  ) => {
    const activeFilters = model.items.filter((f) => f.value !== undefined)
    if (activeFilters.length > 0) {
      captureEvent('wells_filter_applied', {
        filter_count: activeFilters.length,
        filter_fields: activeFilters.map((f) => f.field),
        filter_operators: activeFilters.map((f) => f.operator),
      })
    }
    dataGridProps.onFilterModelChange?.(model)
  }

  const handleColumnVisibilityModelChange = (
    model: GridColumnVisibilityModel
  ) => {
    const hiddenColumns = Object.entries(model)
      .filter(([, visible]) => !visible)
      .map(([field]) => field)
    captureEvent('wells_column_visibility_changed', {
      hidden_count: hiddenColumns.length,
      hidden_columns: hiddenColumns,
    })
  }

  const handleDensityChange = (density: string) => {
    captureEvent('wells_density_changed', { density })
  }

  const handleSortModelChange = (
    model: GridSortModel,
    details: GridCallbackDetails
  ) => {
    if (model.length > 0) {
      captureEvent('wells_sorted', {
        field: model[0].field,
        direction: model[0].sort,
      })
    }
    dataGridProps.onSortModelChange?.(model, details)
  }

  const { triggerExport, isLoading: exportIsLoading } = useExport({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    pageSize: 500,
    meta: {
      params: {
        thing_type: ['water well', 'geothermal well'],
        include_contacts: true,
        ...(search ? { name_contains: search } : {}),
      },
    },
  })

  const Link = useLink()

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'name',
        headerName: WellListColumnLabels.name,
        description:
          'Official well identifier used in bureau records (for example county prefix and local ID).',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'site_name',
        headerName: WellListColumnLabels.siteName,
        description:
          'Name of the monitoring site or facility associated with this well when one is recorded (NMBGMR alternate ID when present).',
        type: 'string',
        minWidth: 140,
        flex: 0.9,
        valueGetter: (_: unknown, row: IWell) => displayWellSiteName(row),
      },
      {
        field: 'monitoring_status',
        headerName: WellListColumnLabels.monitoring,
        description:
          'Whether the well is actively monitored or how monitoring is categorized in the current record.',
        type: 'string',
        width: 160,
      },
      {
        field: 'created_at',
        headerName: WellListColumnLabels.createdAt,
        description:
          'Calendar date when this well record was first added to Ocotillo.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'well_status',
        headerName: WellListColumnLabels.wellStatus,
        description: 'Operational or administrative status of the well.',
        type: 'string',
        width: 150,
      },
      {
        field: 'thing_type',
        headerName: WellListColumnLabels.type,
        description:
          'Infrastructure type from the controlled vocabulary (for example water well or geothermal well).',
        type: 'string',
        width: 130,
      },
      {
        field: 'aquifers',
        headerName: WellListColumnLabels.aquifers,
        description:
          'Aquifer systems linked to this well, summarized from association data. Sort uses the first aquifer name alphabetically among linked systems.',
        minWidth: 180,
        flex: 1,
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
        headerName: WellListColumnLabels.releaseStatus,
        description:
          'Whether the record is released for public viewing under data release rules.',
        type: 'string',
        width: 130,
      },
      {
        field: 'well_depth',
        headerName: WellListColumnLabels.wellDepthFt,
        description:
          'Completed well depth from ground surface to bottom of the well in feet.',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'hole_depth',
        headerName: WellListColumnLabels.holeDepthFt,
        description:
          'Total drilled hole depth from ground surface to bottom of the borehole in feet.',
        type: 'number',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'first_visit_date',
        headerName: WellListColumnLabels.firstVisit,
        description:
          'Date of the bureau first recorded visit to this well when available.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'contacts',
        headerName: WellListColumnLabels.contacts,
        description:
          'People or organizations linked to this well; open a contact from the link. Sort uses the alphabetically first linked contact name.',
        minWidth: 180,
        flex: 1,
        valueGetter: (_: unknown, row: IWell) =>
          row.contacts?.map((c) => getContactDisplayName(c)).join(', ') ?? '',
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
                <span key={contact?.id ?? idx}>
                  {idx > 0 && ', '}
                  {contact?.id != null ? (
                    <Link
                      go={{
                        to: {
                          resource: 'ocotillo.contact',
                          action: 'show',
                          id: contact.id,
                        },
                      }}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                        e.stopPropagation()
                      }
                    >
                      {getContactDisplayName(contact)}
                    </Link>
                  ) : (
                    getContactDisplayName(contact)
                  )}
                </span>
              ))}
            </div>
          )
        },
      },
      {
        field: 'well_completion_date',
        headerName: WellListColumnLabels.completed,
        description: 'Reported date the well construction was completed.',
        width: 130,
        valueGetter: (v: string) => formatAppDate(v),
      },
      {
        field: 'well_driller_name',
        headerName: WellListColumnLabels.driller,
        description:
          'Drilling company name when it was recorded for this well.',
        type: 'string',
        minWidth: 150,
        flex: 1,
      },
      {
        field: 'latitude',
        headerName: WellListColumnLabels.latitude,
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
        headerName: WellListColumnLabels.longitude,
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
        headerName: WellListColumnLabels.alternateIds,
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
          onClick={() => {
            captureEvent('wells_batch_field_sheets')
            go({ to: '/ocotillo/well/batch-export', type: 'push' })
          }}
        >
          Batch Field Sheets
        </Button>
        <ExportButton
          variant="contained"
          loading={exportIsLoading}
          onClick={() => {
            captureEvent('wells_exported', { search_active: Boolean(search) })
            triggerExport()
          }}
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
        onColumnVisibilityModelChange: handleColumnVisibilityModelChange,
        onDensityChange: handleDensityChange,
        onSortModelChange: handleSortModelChange,
      }}
      getRowId={(row) => row.id}
      headerButtons={customHeaderButtons}
      searchMode="server"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search by well name"
      searchAriaLabel="Search wells by well name"
      onRowClick={(params) =>
        captureEvent('wells_row_clicked', { well_id: params.id })
      }
    />
  )
}
