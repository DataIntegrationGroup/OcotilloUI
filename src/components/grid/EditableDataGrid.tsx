import { useCallback, useState } from 'react'
import '@glideapps/glide-data-grid/dist/index.css'
import '@glideapps/glide-data-grid-cells/dist/index.css'
import {
  DataEditor,
  type DataEditorProps,
  type EditableGridCell,
  type GridCell,
  GridCellKind,
  type GridColumn,
  type GridMouseEventArgs,
  type Item,
} from '@glideapps/glide-data-grid'
import { allCells } from '@glideapps/glide-data-grid-cells'
import { useGdgTheme } from './gdgTheme'
import { useElementSize } from './useElementSize'

/** Value a single cell can hold. */
export type CellValue = string | number | boolean | null | undefined

/** Which Glide cell editor a column renders. */
export type GridCellType = 'text' | 'number' | 'uri' | 'boolean' | 'dropdown'

/**
 * Entity-agnostic column definition for {@link EditableDataGrid}.
 *
 * Generic over the row shape `T`. A column reads its display value from a row
 * via {@link getValue} and — when editable — produces an updated row via
 * {@link setValue}. Both keep the grid decoupled from any particular field
 * layout, so the same component drives ocotillo wells, geothermal records, etc.
 */
export interface GridColumnSpec<T> {
  /** Stable column id (used as a React/GDG key). */
  id: string
  /** Header label. */
  title: string
  /** Optional description shown as a tooltip when hovering the column header. */
  tooltip?: string
  /** Column width in px. */
  width?: number
  /** Optional group header label (for grouped grids). */
  group?: string
  /** Editor kind. Defaults to `'text'`. */
  kind?: GridCellType
  /** Allowed values for a `'dropdown'` column. Ignored for other kinds. */
  options?: string[]
  /** Whether cells in this column can be edited inline. Defaults to `false`. */
  editable?: boolean
  /** Read the display value for a row. */
  getValue: (row: T) => CellValue
  /**
   * Optional display formatter. Overrides the default string rendering for the
   * cell without changing the underlying edit value (e.g. round a coordinate
   * for display while keeping full precision for save).
   */
  format?: (value: CellValue) => string
  /**
   * Produce an updated row given a new cell value. Required for editable
   * columns; ignored otherwise.
   */
  setValue?: (row: T, value: CellValue) => T
  /**
   * Optional validator returning an error message for an invalid value, or
   * `undefined` when valid. Reserved for inline validation feedback; not yet
   * surfaced by the grid.
   */
  validate?: (value: CellValue, row: T) => string | undefined
  /** Called when a cell in this column is clicked (e.g. a URI link). */
  onClick?: (row: T, rowIndex: number) => void
}

export interface EditableDataGridProps<T>
  extends Pick<
    DataEditorProps,
    | 'freezeColumns'
    | 'rowMarkers'
    | 'rowHeight'
    | 'headerHeight'
    | 'groupHeaderHeight'
    | 'smoothScrollX'
    | 'smoothScrollY'
  > {
  columns: GridColumnSpec<T>[]
  rows: T[]
  /**
   * Called with the full next row array whenever a cell edit lands. Edits are
   * applied to a copy — the parent owns the source of truth and can track dirty
   * rows for an explicit batch save.
   */
  onRowsChange?: (rows: T[]) => void
  /**
   * Per-row validation errors keyed by column id. Return `undefined` for a row
   * with no errors. Errored cells render with an error-tinted background so
   * failures (e.g. a rejected batch save) surface inline.
   */
  cellErrors?: (rowIndex: number) => Record<string, string> | undefined
  /** Show a centered loading message instead of the grid. */
  isLoading?: boolean
  loadingMessage?: string
}

// Background tint applied to a cell that has a validation error.
const ERROR_CELL_THEME = { bgCell: '#fee2e2', bgCellMedium: '#fee2e2' }

function toDisplayString(value: CellValue): string {
  return value != null ? String(value) : ''
}

/**
 * Reusable spreadsheet-style grid built on Glide Data Grid.
 *
 * Handles theme, auto-sizing (ResizeObserver), cell-kind dispatch, and
 * edit-to-row mapping. Callers supply a typed row array and a column spec;
 * edits are lifted back through {@link EditableDataGridProps.onRowsChange}.
 */
export function EditableDataGrid<T>({
  columns,
  rows,
  onRowsChange,
  cellErrors,
  isLoading = false,
  loadingMessage = 'Loading…',
  freezeColumns,
  rowMarkers = 'none',
  rowHeight = 36,
  headerHeight = 38,
  groupHeaderHeight,
  smoothScrollX = true,
  smoothScrollY = true,
}: EditableDataGridProps<T>) {
  const theme = useGdgTheme()
  const [containerRef, size] = useElementSize()
  // Header tooltip: text + position (relative to the grid container).
  const [tooltip, setTooltip] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)

  const onItemHovered = useCallback(
    (args: GridMouseEventArgs) => {
      if (args.kind === 'header') {
        const text = columns[args.location[0]]?.tooltip
        if (text) {
          setTooltip({
            text,
            x: args.bounds.x + args.bounds.width / 2,
            y: args.bounds.y + args.bounds.height,
          })
          return
        }
      }
      setTooltip(null)
    },
    [columns]
  )

  const gridColumns: GridColumn[] = columns.map((c) => ({
    id: c.id,
    title: c.title,
    width: c.width,
    ...(c.group ? { group: c.group } : {}),
  }))

  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const rowData = rows[row]
      if (rowData === undefined) {
        return { kind: GridCellKind.Loading, allowOverlay: false }
      }
      const colDef = columns[col]
      const value = colDef.getValue(rowData)
      const display = colDef.format
        ? colDef.format(value)
        : toDisplayString(value)
      const editable = colDef.editable === true && colDef.setValue !== undefined
      const error = cellErrors?.(row)?.[colDef.id]
      const errorTheme = error ? { themeOverride: ERROR_CELL_THEME } : {}

      if (colDef.kind === 'uri') {
        return {
          kind: GridCellKind.Uri,
          data: display,
          allowOverlay: false,
          readonly: true,
          hoverEffect: colDef.onClick !== undefined,
          ...errorTheme,
        }
      }

      if (colDef.kind === 'number') {
        return {
          kind: GridCellKind.Number,
          data: typeof value === 'number' ? value : undefined,
          displayData: display,
          allowOverlay: editable,
          readonly: !editable,
          ...errorTheme,
        }
      }

      if (colDef.kind === 'boolean') {
        return {
          kind: GridCellKind.Boolean,
          data: value === true || value === 'true',
          allowOverlay: false,
          readonly: !editable,
          ...errorTheme,
        }
      }

      if (colDef.kind === 'dropdown') {
        return {
          kind: GridCellKind.Custom,
          allowOverlay: editable,
          readonly: !editable,
          copyData: display,
          data: {
            kind: 'dropdown-cell',
            value: display,
            allowedValues: colDef.options ?? [],
          },
          ...errorTheme,
        }
      }

      return {
        kind: GridCellKind.Text,
        data: display,
        displayData: display,
        allowOverlay: editable,
        readonly: !editable,
        ...errorTheme,
      }
    },
    [columns, rows, cellErrors]
  )

  const onCellEdited = useCallback(
    ([col, row]: Item, newValue: EditableGridCell) => {
      const colDef = columns[col]
      if (colDef.editable !== true || colDef.setValue === undefined) return
      const rowData = rows[row]
      if (rowData === undefined) return

      let next: CellValue
      if (newValue.kind === GridCellKind.Number) {
        next = newValue.data ?? null
      } else if (newValue.kind === GridCellKind.Text) {
        next = newValue.data === '' ? null : newValue.data
      } else if (newValue.kind === GridCellKind.Boolean) {
        next = newValue.data === true
      } else if (newValue.kind === GridCellKind.Custom) {
        // Dropdown cell — read the selected value from its data payload.
        const raw = (newValue.data as { value?: string | null })?.value
        next = raw == null || raw === '' ? null : raw
      } else {
        return
      }

      const updated = [...rows]
      updated[row] = colDef.setValue(rowData, next)
      onRowsChange?.(updated)
    },
    [columns, rows, onRowsChange]
  )

  const onCellClicked = useCallback(
    ([col, row]: Item) => {
      const colDef = columns[col]
      const rowData = rows[row]
      if (colDef?.onClick && rowData !== undefined) colDef.onClick(rowData, row)
    },
    [columns, rows]
  )

  return (
    <div ref={containerRef} className="relative flex flex-col flex-1 min-w-0">
      {isLoading || size.width === 0 ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          {isLoading ? loadingMessage : null}
        </div>
      ) : (
        <>
          <DataEditor
            columns={gridColumns}
            rows={rows.length}
            getCellContent={getCellContent}
            onCellEdited={onCellEdited}
            onCellClicked={onCellClicked}
            onItemHovered={onItemHovered}
            customRenderers={allCells}
            width={size.width}
            height={size.height}
            theme={theme}
            freezeColumns={freezeColumns}
            rowMarkers={rowMarkers}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            groupHeaderHeight={groupHeaderHeight}
            smoothScrollX={smoothScrollX}
            smoothScrollY={smoothScrollY}
            getGroupDetails={(group) => ({ name: group })}
          />
          {tooltip && (
            <div
              className="pointer-events-none absolute z-50 max-w-xs -translate-x-1/2 rounded bg-neutral-900 px-2 py-1 text-xs text-white shadow-md"
              style={{ left: tooltip.x, top: tooltip.y + 4 }}
            >
              {tooltip.text}
            </div>
          )}
        </>
      )}
    </div>
  )
}
