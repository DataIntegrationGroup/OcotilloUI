import { useEffect, useMemo, useState } from 'react'
import { useList, useParsed } from '@refinedev/core'
import type { IWellRecord } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import {
  EditableDataGrid,
  type CellValue,
  type GridColumnSpec,
} from '@/components/grid'
import { Button } from '@/components/ui/button'

/**
 * Editable text column for a well-record field.
 *
 * PROVISIONAL — the geothermal API contract is not finalized. These columns
 * mirror the current IWellRecord shape (11 string fields) so the grid reads and
 * edits real data today; swap this list for the real field set / types once the
 * contract lands. Column changes are localized to this array.
 */
function textCol(
  id: keyof IWellRecord,
  title: string,
  width = 150
): GridColumnSpec<IWellRecord> {
  return {
    id,
    title,
    width,
    editable: true,
    getValue: (r) => r[id] ?? '',
    setValue: (r, v) => ({ ...r, [id]: v ?? '' }),
  }
}

const RECORD_COLUMNS: GridColumnSpec<IWellRecord>[] = [
  {
    id: 'OBJECTID',
    title: 'ID',
    width: 90,
    kind: 'number',
    // Server-assigned key — read-only.
    getValue: (r) => r.OBJECTID,
  },
  textCol('WellDataID', 'WellDataID', 130),
  textCol('WellName', 'WellName', 180),
  textCol('WellNumber', 'WellNumber', 130),
  textCol('API_suffix', 'API_suffix', 120),
  textCol('ActionDate', 'ActionDate', 130),
  textCol('EntryDate', 'EntryDate', 130),
  textCol('EnteredBy', 'EnteredBy', 140),
  textCol('RecrdSetID', 'RecrdSetID', 120),
  textCol('SourceID', 'SourceID', 120),
  textCol('Comments', 'Comments', 280),
]

function rowKey(r: IWellRecord): string {
  return String(r.OBJECTID)
}

/**
 * Phase 2 — inline-editable spreadsheet of the records belonging to one well.
 *
 * Reads `wells/{id}/records` through the geothermal provider and lets an admin
 * edit cells in place. Edits accumulate in local state and mark rows dirty; the
 * grid does NOT write back yet — an explicit batch save lands in Phase 3.
 * Admin-gated per BDMS-878 (`canManageGeothermal`).
 */
export const GeoThermalRecordsGrid = () => {
  const { id } = useParsed()
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()

  const { query } = useList<IWellRecord>({
    resource: `wells/${id}/records`,
    dataProviderName: 'geothermal',
    pagination: { pageSize: 500, mode: 'server' },
    queryOptions: { enabled: canManageGeothermal && id != null },
  })

  // Local, editable copy. `original` is the pristine snapshot used to compute
  // which rows are dirty (keyed by server id).
  const [records, setRecords] = useState<IWellRecord[]>([])
  const [original, setOriginal] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const data = query.data?.data
    if (!data) return
    setRecords(data)
    setOriginal(new Map(data.map((r) => [rowKey(r), JSON.stringify(r)])))
  }, [query.data])

  const dirtyCount = useMemo(() => {
    let n = 0
    for (const r of records) {
      const snap = original.get(rowKey(r))
      if (snap !== undefined && snap !== JSON.stringify(r)) n++
    }
    return n
  }, [records, original])

  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Checking access…
      </div>
    )
  }

  if (!canManageGeothermal) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        You need the Geothermal Admin role to enter well data.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2 pt-6">
        <span className="text-2xl font-black mr-2">Well records</span>
        {id != null && (
          <span className="text-sm text-muted-foreground">Well {String(id)}</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}
          </span>
          {/* Save is wired in Phase 3 (explicit batch write-back). */}
          <Button size="sm" disabled title="Batch save lands in Phase 3">
            Save changes
          </Button>
        </div>
      </div>

      <EditableDataGrid
        columns={RECORD_COLUMNS}
        rows={records}
        onRowsChange={setRecords}
        isLoading={query.isLoading}
        loadingMessage="Loading records…"
        freezeColumns={1}
      />
    </div>
  )
}
