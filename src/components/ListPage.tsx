import { Breadcrumb, ExportButton, List } from '@refinedev/mui'
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  gridFilterActiveItemsSelector,
  gridColumnLookupSelector,
  gridFilterModelSelector,
  GridFilterItem,
  useGridApiContext,
  useGridSelector,
} from '@mui/x-data-grid'
import { settings } from '@/settings'
import React, { useMemo, useState } from 'react'
import { CanAccess, useExport, useNavigation, useResourceParams } from '@refinedev/core'
import { Box, Chip, InputBase, Stack, Tooltip, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

// Hides the text label, keeping only the icon. The built-in buttons must be used
// (not custom icon buttons) so that the panel anchors correctly next to the button.
const iconOnlySx = {
  minWidth: 'auto',
  px: 0.75,
  fontSize: 0,
  '& .MuiButton-startIcon': { mr: 0, ml: 0 },
}

// Shows a dismissible chip for each active column filter.
function ActiveFilterChips() {
  const apiRef = useGridApiContext()
  const activeFilters = useGridSelector(apiRef, gridFilterActiveItemsSelector)
  const columns = useGridSelector(apiRef, gridColumnLookupSelector)
  const filterModel = useGridSelector(apiRef, gridFilterModelSelector)

  if (activeFilters.length === 0) return null

  const removeFilter = (filterId: GridFilterItem['id']) => {
    apiRef.current.setFilterModel({
      ...filterModel,
      items: filterModel.items.filter((item) => item.id !== filterId),
    })
  }

  return (
    <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', alignItems: 'center', pt: 0.5, pb: 0.25 }}>
      {activeFilters.map((filter) => {
        const column = columns[filter.field]
        const fieldLabel = column?.headerName ?? filter.field
        const value = filter.value != null && filter.value !== '' ? ` ${filter.operator} "${filter.value}"` : ` ${filter.operator}`
        return (
          <Chip
            key={filter.id}
            size="small"
            label={`${fieldLabel}${value}`}
            onDelete={() => removeFilter(filter.id)}
            sx={{ fontSize: 12 }}
          />
        )
      })}
    </Stack>
  )
}

// Toolbar inside the DataGrid:
// - Row 1 (right-aligned): filter, columns, density, export buttons
// - Row 2 (only when filters are active): dismissible filter chips
// The search input lives OUTSIDE the DataGrid to avoid focus-loss on re-render.
// Built-in toolbar buttons are used (not custom icon buttons) so panels anchor correctly.
function ListPageToolbar() {
  return (
    <GridToolbarContainer sx={{ px: 1, py: 0.5, flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
        <GridToolbarFilterButton sx={iconOnlySx} />
        <GridToolbarColumnsButton sx={iconOnlySx} />
        <GridToolbarDensitySelector sx={iconOnlySx} />
        <GridToolbarExport sx={iconOnlySx} />
      </Box>
      <ActiveFilterChips />
    </GridToolbarContainer>
  )
}

type ListPageProps = {
  title?: string | null
  description?: string | null
  columns: any
  dataGridProps: any
  exportProps?: any
  children?: any
  onSelectionChange?: (selectionModel: any) => void
  getRowId?: (row: any) => number
  isLoading?: any
  headerButtons?: any
  disableRowClick?: boolean
}

export const ListPage: React.FC<ListPageProps> = ({
  title,
  description,
  columns,
  dataGridProps,
  getRowId,
  exportProps,
  children,
  onSelectionChange,
  isLoading,
  headerButtons,
  disableRowClick = false,
}) => {
  if (!exportProps) {
    exportProps = { pageSize: 1000 }
  }

  const [quickFilter, setQuickFilter] = useState('')

  const { show } = useNavigation()
  const { resource } = useResourceParams()

  const handleSelectionChangeWrapper = (selectionModel: any) => {
    if (onSelectionChange) {
      onSelectionChange(selectionModel)
    }
  }

  const { triggerExport, isLoading: exportIsLoading } = useExport(exportProps)
  const defaultHeaderButtons = ({ defaultButtons }) => {
    return (
      <>
        <CanAccess>{defaultButtons}</CanAccess>
        <ExportButton
          variant={'contained'}
          loading={exportIsLoading}
          onClick={triggerExport}
        />
      </>
    )
  }

  const rowCount = dataGridProps.rowCount as number | undefined

  const { rows: allRows, ...restDataGridProps } = dataGridProps

  const filteredRows = useMemo(() => {
    if (!quickFilter || !allRows) return allRows ?? []
    const lower = quickFilter.toLowerCase()
    return allRows.filter((row: any) =>
      Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(lower))
    )
  }, [allRows, quickFilter])

  return (
    <CanAccess>
      <List
        headerButtons={headerButtons || defaultHeaderButtons}
        title={
          title ? (
            <Box>
              <Typography variant="h3" fontWeight={700}>
                {title}
              </Typography>
              {description && (
                <Typography
                  variant="body1"
                  sx={{ maxWidth: '85ch', mt: 0.5, color: 'text.secondary' }}
                >
                  {description}
                </Typography>
              )}
            </Box>
          ) : undefined
        }
        breadcrumb={<Breadcrumb hideIcons={true} />}
        wrapperProps={{
          elevation: 0,
          sx: { backgroundColor: 'background.wrapper', boxShadow: 'none', borderRadius: 1, padding: 0 },
        }}
        headerProps={{
          sx: {
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            '.MuiCardHeader-action': {
              alignSelf: { xs: 'flex-end', md: 'flex-start' },
              mt: { xs: 1, md: 0.5 },
              mr: 0,
            },
          },
        }}
        contentProps={{ sx: { pt: 1 } }}
      >
        {children}

        {/* Search bar and record count sit outside the DataGrid to preserve input focus */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 0.5,
            pb: 0.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              px: 1,
              py: 0.25,
              width: 260,
              bgcolor: 'background.paper',
            }}
          >
            <SearchIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            <InputBase
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              placeholder="Filter this page..."
              sx={{ fontSize: 14, flex: 1 }}
              inputProps={{ 'aria-label': 'Filter rows on this page' }}
            />
          </Box>
          {rowCount !== undefined && rowCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {rowCount.toLocaleString()} total records
            </Typography>
          )}
        </Box>

        <DataGrid
          {...restDataGridProps}
          rows={filteredRows}
          showToolbar
          slots={{ toolbar: ListPageToolbar }}
          slotProps={{
            loadingOverlay: {
              variant: 'linear-progress',
              noRowsVariant: 'skeleton',
            },
          }}
          disableRowSelectionOnClick={false}
          rowHeight={settings.rowHeight}
          getRowId={getRowId ? getRowId : (row) => row.PointID}
          onRowSelectionModelChange={handleSelectionChangeWrapper}
          onRowClick={
            !disableRowClick && resource
              ? (params) => show(resource.name, params.id as string | number)
              : undefined
          }
          loading={isLoading !== undefined ? isLoading : restDataGridProps.loading}
          columns={columns}
          sx={{ cursor: disableRowClick ? 'default' : 'pointer' }}
        />
      </List>
    </CanAccess>
  )
}
