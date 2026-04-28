import { ExportButton, List } from '@refinedev/mui'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
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
  GridColDef,
} from '@mui/x-data-grid'
import { settings } from '@/settings'
import React, { useMemo, useState } from 'react'
import {
  CanAccess,
  useExport,
  useNavigation,
  useResourceParams,
} from '@refinedev/core'
import { Box, Chip, InputBase, Stack, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

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
    <Stack
      direction="row"
      sx={{
        gap: 0.5,
        flexWrap: 'wrap',
        alignItems: 'center',
        pt: 0.5,
        pb: 0.25,
      }}
    >
      {activeFilters.map((filter) => {
        const column = columns[filter.field]
        const fieldLabel = column?.headerName ?? filter.field
        const value =
          filter.value != null && filter.value !== ''
            ? ` ${filter.operator} "${filter.value}"`
            : ` ${filter.operator}`
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
    <GridToolbarContainer
      sx={{
        px: 1,
        py: 0.5,
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
        <GridToolbarFilterButton
          slotProps={{
            button: { 'data-testid': 'grid-toolbar-filter-button' },
          }}
        />
        <GridToolbarColumnsButton
          slotProps={{
            button: { 'data-testid': 'grid-toolbar-columns-button' },
          }}
        />
        <GridToolbarDensitySelector
          slotProps={{
            button: { 'data-testid': 'grid-toolbar-density-selector' },
          }}
        />
        <GridToolbarExport
          slotProps={{ button: { 'data-testid': 'grid-toolbar-export' } }}
        />
      </Box>
      <ActiveFilterChips />
    </GridToolbarContainer>
  )
}

type ListPageProps = {
  title?: string
  description?: string
  columns: GridColDef[]
  dataGridProps: any
  getRowId?: (row: any) => string | number
  exportProps?: any
  children?: React.ReactNode
  onSelectionChange?: (selectionModel: any) => void
  isLoading?: boolean
  headerButtons?: any
  disableRowClick?: boolean

  searchMode?: 'client' | 'server'
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Overrides default aria-label on the search input when server search is customized */
  searchAriaLabel?: string
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
  searchMode = 'client',
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
}) => {
  if (!exportProps) {
    exportProps = { pageSize: 1000 }
  }

  const [localQuickFilter, setLocalQuickFilter] = useState('')
  const quickFilter =
    searchMode === 'server' ? (searchValue ?? '') : localQuickFilter

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

  const getSearchableCellValue = (row: any, col: GridColDef<any>) => {
    const raw = row[col.field]

    if (raw == null) return ''
    if (Array.isArray(raw)) return raw.map((v) => String(v)).join(', ')
    if (typeof raw === 'object') return JSON.stringify(raw)
    return String(raw)
  }

  const filteredRows = useMemo(() => {
    if (searchMode === 'server') {
      return allRows ?? []
    }

    if (!quickFilter || !allRows) return allRows ?? []

    const needle = quickFilter.toLowerCase().trim()

    return allRows.filter((row: any) =>
      columns.some((col) =>
        getSearchableCellValue(row, col).toLowerCase().includes(needle)
      )
    )
  }, [allRows, quickFilter, columns, searchMode])

  const handleSearchChange = (value: string) => {
    if (searchMode === 'server') {
      onSearchChange?.(value)
    } else {
      setLocalQuickFilter(value)
    }
  }

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
        breadcrumb={<AppBreadcrumb />}
        wrapperProps={{
          elevation: 0,
          sx: {
            backgroundColor: 'background.wrapper',
            boxShadow: 'none',
            borderRadius: 1,
            padding: 0,
          },
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
            px: 0,
            pb: 1.5,
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
              width: 400,
              bgcolor: 'background.paper',
            }}
          >
            <SearchIcon
              sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }}
            />
            <InputBase
              value={quickFilter}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                searchPlaceholder ??
                (searchMode === 'server'
                  ? 'Search all records...'
                  : 'Filter this page...')
              }
              sx={{ fontSize: 14, flex: 1 }}
              inputProps={{
                'aria-label':
                  searchAriaLabel ??
                  (searchMode === 'server'
                    ? 'Search all records'
                    : 'Filter rows on this page'),
              }}
            />
          </Box>
          {rowCount !== undefined && rowCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {rowCount.toLocaleString()} total records
            </Typography>
          )}
        </Box>

        {/* Refine sets filterDebounceMs to 0 for server-side grids; restore MUI debounce so toolbar column filters keep input focus while typing. */}
        <DataGrid
          {...restDataGridProps}
          rows={filteredRows}
          filterDebounceMs={
            restDataGridProps.filterMode === 'server'
              ? 350
              : restDataGridProps.filterDebounceMs
          }
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
          loading={
            isLoading !== undefined ? isLoading : restDataGridProps.loading
          }
          columns={columns}
          sx={{ cursor: disableRowClick ? 'default' : 'pointer' }}
        />
      </List>
    </CanAccess>
  )
}
