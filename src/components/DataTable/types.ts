import type { CrudOperators } from '@refinedev/core'
import type { RowData } from '@tanstack/react-table'

/**
 * Column metadata shared by every DataTable. Column definitions carry their own
 * label, alignment and filter shape so the toolbar, the visibility menu and the
 * filter chips can all describe a column without the page repeating itself.
 */

export type DataTableFilterOption = { label: string; value: string }

/** Comparisons offered by the numeric and date filters. */
export type DataTableComparisonOperator = Extract<
  CrudOperators,
  'eq' | 'gte' | 'lte' | 'gt' | 'lt'
>

/** Value stored for a numeric or date column filter. */
export type DataTableComparisonValue = {
  operator: DataTableComparisonOperator
  value: string
}

export const isComparisonValue = (
  value: unknown
): value is DataTableComparisonValue =>
  typeof value === 'object' &&
  value !== null &&
  'operator' in value &&
  'value' in value

export const COMPARISON_OPERATOR_LABELS: Record<
  DataTableComparisonOperator,
  string
> = {
  eq: '=',
  gte: '≥',
  lte: '≤',
  gt: '>',
  lt: '<',
}

export type DataTableFilterConfig =
  /** Free text match; `contains` unless the API only understands equality. */
  | {
      type: 'text'
      operator?: Extract<CrudOperators, 'contains' | 'eq' | 'startswith'>
      placeholder?: string
    }
  /** Single choice from a known vocabulary. */
  | {
      type: 'select'
      options: DataTableFilterOption[]
      operator?: Extract<CrudOperators, 'eq' | 'contains'>
    }
  /** Comparison against a number or a date; the operator ships with the value. */
  | {
      type: 'number' | 'date'
      defaultOperator?: DataTableComparisonOperator
    }

declare module '@tanstack/react-table' {
  // The generics have to mirror the upstream declaration to merge with it.
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human label used by the visibility menu, filter chips and export. */
    label?: string
    /** Long-form help shown as the header tooltip. */
    description?: string
    align?: 'left' | 'center' | 'right'
    headClassName?: string
    cellClassName?: string
    filter?: DataTableFilterConfig
  }
}

export const DEFAULT_TEXT_FILTER_OPERATOR = 'contains' as const
export const DEFAULT_SELECT_FILTER_OPERATOR = 'eq' as const
