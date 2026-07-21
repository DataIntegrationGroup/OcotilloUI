import { useCallback } from 'react'
import '@glideapps/glide-data-grid/dist/index.css'
import {
  DataEditor,
  type DataEditorProps,
  type EditableGridCell,
  type GridCell,
  GridCellKind,
  type GridColumn,
  type Item,
} from '@glideapps/glide-data-grid'
import { useGdgTheme } from './gdgTheme'
import { useElementSize } from './useElementSize'

/** Value a single cell can hold. */
export type CellValue = string | number | null | undefined

/** Which Glide cell editor a column renders. */
export type GridCellType = 'text' | 'number' | 'uri'

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
  /** Column width in px. */
  width?: number
  /** Optional group header label (for grouped grids). */
  group?: string
  /** Editor kind. Defaults to `'text'`. */
  kind?: GridCellType
  /** Whether cells in this column can be edited inline. Defaults to `false`. */
  editable?: boolean
  /** Read the display value for a row. */
  getValue: (row: T) => CellValue
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
  onClick?: (row: T) => void
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
  /** Show a centered loading message instead of the grid. */
  isLoading?: boolean
  loadingMessage?: string
}

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
      const display = toDisplayString(value)
      const editable = colDef.editable === true && colDef.setValue !== undefined

      if (colDef.kind === 'uri') {
        return {
          kind: GridCellKind.Uri,
          data: display,
          allowOverlay: false,
          readonly: true,
          hoverEffect: colDef.onClick !== undefined,
        }
      }

      if (colDef.kind === 'number') {
        return {
          kind: GridCellKind.Number,
          data: typeof value === 'number' ? value : undefined,
          displayData: display,
          allowOverlay: editable,
          readonly: !editable,
        }
      }

      return {
        kind: GridCellKind.Text,
        data: display,
        displayData: display,
        allowOverlay: editable,
        readonly: !editable,
      }
    },
    [columns, rows]
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
      if (colDef?.onClick && rowData !== undefined) colDef.onClick(rowData)
    },
    [columns, rows]
  )

  return (
    <div ref={containerRef} className="flex flex-col flex-1 min-w-0">
      {isLoading || size.width === 0 ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          {isLoading ? loadingMessage : null}
        </div>
      ) : (
        <DataEditor
          columns={gridColumns}
          rows={rows.length}
          getCellContent={getCellContent}
          onCellEdited={onCellEdited}
          onCellClicked={onCellClicked}
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
      )}
    </div>
  )
}
