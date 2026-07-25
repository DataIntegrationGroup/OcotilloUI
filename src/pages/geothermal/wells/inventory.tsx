import { useMemo, useState } from 'react'
import type { IWell } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import {
  EditableDataGrid,
  type CellValue,
  type GridColumnSpec,
} from '@/components/grid'
import { Button } from '@/components/ui/button'
import { canEnterGeothermalData } from './recordsGridLogic'

// A not-yet-saved well being inventoried. well_data_id / thing_id are
// server-assigned, so drafts hold only the user-entered fields.
type WellDraft = Partial<Omit<IWell, 'well_data_id' | 'thing_id'>>

// Fields the user fills when inventorying a new well (everything except the
// server-assigned id). Enum fields (well_class/well_type/status) are plain text
// in P1 — dropdowns land in P4. Boolean/date editors also come in P4.
const TEXT_FIELDS: (keyof WellDraft)[] = [
  'name',
  'api',
  'well_number',
  'well_class',
  'well_type',
  'status',
  'operator',
  'owner',
  'completion_date',
  'has_geothermal_data',
  'county',
  'state',
]
const NUMBER_FIELDS: (keyof WellDraft)[] = [
  'total_depth',
  'latitude',
  'longitude',
]

const HEADERS: Partial<Record<keyof WellDraft, string>> = {
  name: 'Name',
  api: 'API',
  well_number: 'Well #',
  well_class: 'Class',
  well_type: 'Type',
  status: 'Status',
  operator: 'Operator',
  owner: 'Owner',
  completion_date: 'Completion',
  has_geothermal_data: 'Geo data?',
  county: 'County',
  state: 'State',
  total_depth: 'Total depth',
  latitude: 'Latitude',
  longitude: 'Longitude',
}

function textCol(id: keyof WellDraft): GridColumnSpec<WellDraft> {
  return {
    id,
    title: HEADERS[id] ?? id,
    width: 150,
    editable: true,
    getValue: (r) => (r[id] as CellValue) ?? '',
    setValue: (r, v) => ({ ...r, [id]: v ?? '' }),
  }
}

function numberCol(id: keyof WellDraft): GridColumnSpec<WellDraft> {
  return {
    id,
    title: HEADERS[id] ?? id,
    width: 130,
    kind: 'number',
    editable: true,
    getValue: (r) => (r[id] as CellValue) ?? null,
    setValue: (r, v) => ({ ...r, [id]: v as number | null }),
  }
}

const COLUMNS: GridColumnSpec<WellDraft>[] = [
  ...TEXT_FIELDS.map(textCol),
  ...NUMBER_FIELDS.map(numberCol),
]

const ALL_FIELDS: (keyof WellDraft)[] = [...TEXT_FIELDS, ...NUMBER_FIELDS]

function isBlankDraft(r: WellDraft): boolean {
  return ALL_FIELDS.every((k) => {
    const v = r[k]
    return v == null || v === ''
  })
}

const INITIAL_ROWS = 10
const ADD_ROW_COUNT = 10

/**
 * P1 — Geothermal well inventory (direct grid entry).
 *
 * An editable spreadsheet for inventorying new geothermal wells. Rows are blank
 * well drafts the user types or pastes into; "Add rows" appends more. Entries
 * live in local state only — batch create lands in P2, CSV load in P3, and
 * dropdown/date/boolean editors + validation in P4. Admin-gated per BDMS-878
 * (`canEnterGeothermalData`, bypassed in local dev).
 */
export const GeoThermalWellInventory = () => {
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()

  const [rows, setRows] = useState<WellDraft[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => ({}))
  )

  const filledCount = useMemo(
    () => rows.filter((r) => !isBlankDraft(r)).length,
    [rows]
  )

  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Checking access…
      </div>
    )
  }

  if (!canEnterGeothermalData(canManageGeothermal)) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        You need the Geothermal Admin role to inventory wells.
      </div>
    )
  }

  const handleAddRows = () =>
    setRows((prev) => [
      ...prev,
      ...Array.from({ length: ADD_ROW_COUNT }, () => ({})),
    ])

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2 pt-6">
        <span className="text-2xl font-black mr-2">Well inventory</span>
        <span className="text-sm text-muted-foreground">
          Enter new geothermal wells
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filledCount} {filledCount === 1 ? 'well' : 'wells'} to add
          </span>
          <Button variant="outline" size="sm" onClick={handleAddRows}>
            Add {ADD_ROW_COUNT} rows
          </Button>
          {/* Batch create lands in P2; CSV upload in P3. */}
          <Button size="sm" disabled title="Batch create lands in P2">
            Create wells
          </Button>
        </div>
      </div>

      <EditableDataGrid
        columns={COLUMNS}
        rows={rows}
        onRowsChange={setRows}
        freezeColumns={1}
      />
    </div>
  )
}
