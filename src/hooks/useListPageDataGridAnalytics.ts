import { useMemo } from 'react'
import {
  GridCallbackDetails,
  GridColumnVisibilityModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid'
import { captureEvent } from '@/analytics/posthog'

type DataGridHandlerProps = {
  onFilterModelChange?: (
    model: GridFilterModel,
    details: GridCallbackDetails
  ) => void
  onColumnVisibilityModelChange?: (model: GridColumnVisibilityModel) => void
  onDensityChange?: (density: string) => void
  onSortModelChange?: (
    model: GridSortModel,
    details: GridCallbackDetails
  ) => void
}

/**
 * Wraps DataGrid change handlers with PostHog analytics. Use with ListPage on
 * any resource list (Wells, Projects, etc.) so grid interactions are tracked
 * consistently.
 */
export function useListPageDataGridAnalytics<T extends DataGridHandlerProps>(
  dataGridProps: T,
  eventPrefix: string
): T {
  return useMemo(() => {
    const handleFilterModelChange = (
      model: GridFilterModel,
      details: GridCallbackDetails
    ) => {
      const activeFilters = model.items.filter((f) => f.value !== undefined)
      if (activeFilters.length > 0) {
        captureEvent(`${eventPrefix}_filter_applied`, {
          filter_count: activeFilters.length,
          filter_fields: activeFilters.map((f) => f.field),
          filter_operators: activeFilters.map((f) => f.operator),
        })
      }
      dataGridProps.onFilterModelChange?.(model, details)
    }

    const handleColumnVisibilityModelChange = (
      model: GridColumnVisibilityModel
    ) => {
      const hiddenColumns = Object.entries(model)
        .filter(([, visible]) => !visible)
        .map(([field]) => field)
      captureEvent(`${eventPrefix}_column_visibility_changed`, {
        hidden_count: hiddenColumns.length,
        hidden_columns: hiddenColumns,
      })
      dataGridProps.onColumnVisibilityModelChange?.(model)
    }

    const handleDensityChange = (density: string) => {
      captureEvent(`${eventPrefix}_density_changed`, { density })
      dataGridProps.onDensityChange?.(density)
    }

    const handleSortModelChange = (
      model: GridSortModel,
      details: GridCallbackDetails
    ) => {
      if (model.length > 0) {
        captureEvent(`${eventPrefix}_sorted`, {
          field: model[0].field,
          direction: model[0].sort,
        })
      }
      dataGridProps.onSortModelChange?.(model, details)
    }

    return {
      ...dataGridProps,
      onFilterModelChange: handleFilterModelChange,
      onColumnVisibilityModelChange: handleColumnVisibilityModelChange,
      onDensityChange: handleDensityChange,
      onSortModelChange: handleSortModelChange,
    }
  }, [dataGridProps, eventPrefix])
}
