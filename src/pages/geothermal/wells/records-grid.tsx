import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDataProvider, useList, useParsed } from '@refinedev/core'
import type { IWellRecord } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import { EditableDataGrid, type GridColumnSpec } from '@/components/grid'
import { Button } from '@/components/ui/button'
import {
  canEnterGeothermalData,
  computePendingOps,
  flattenFieldErrors,
  isNewRow,
  makeBlankRecord,
  NEW_PREFIX,
  rowKey,
  type FieldErrors,
} from './recordsGridLogic'

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
    // Server-assigned string key — read-only text. Blank for new rows (their
    // OBJECTID holds a client temp id like "new:1" until saved).
    getValue: (r) => (isNewRow(r) ? '' : r.OBJECTID),
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

const ADD_ROW_COUNT = 10

interface SaveSummary {
  saved: number
  failed: number
}

/**
 * Phase 2/3/4 — inline-editable spreadsheet of the records belonging to one
 * well, with explicit batch save and inline new-record entry.
 *
 * Reads `wells/{id}/records` through the geothermal provider and lets an admin
 * edit cells in place and append blank rows for new records — no separate
 * upload step. Edits and new rows accumulate in local state; "Save changes"
 * flushes each pending row through the provider (there is no server bulk
 * endpoint): existing dirty rows via `update`, new rows via `create`. Per-row
 * tracking — saved rows clear their pending flag (a created row adopts the
 * server-returned record, gaining its real id); failed rows stay pending for
 * retry and have their rejected cells tinted from the provider's Pydantic
 * `fieldErrors`. Admin-gated per BDMS-878 (`canManageGeothermal`).
 */
export const GeoThermalRecordsGrid = () => {
  const { id } = useParsed()
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()
  const dataProvider = useDataProvider()

  const { query } = useList<IWellRecord>({
    resource: `thing/geothermal-well/${id}/records`,
    dataProviderName: 'geothermal',
    pagination: { pageSize: 500, mode: 'server' },
    queryOptions: {
      enabled: canEnterGeothermalData(canManageGeothermal) && id != null,
    },
  })

  // Local, editable copy. `original` is the pristine snapshot used to compute
  // which existing rows are dirty (keyed by server id).
  const [records, setRecords] = useState<IWellRecord[]>([])
  const [original, setOriginal] = useState<Map<string, string>>(new Map())
  const [newCounter, setNewCounter] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveErrors, setSaveErrors] = useState<Map<string, FieldErrors>>(
    new Map()
  )
  const [summary, setSummary] = useState<SaveSummary | null>(null)

  useEffect(() => {
    const data = query.data?.data
    if (!data) return
    setRecords(data)
    setOriginal(new Map(data.map((r) => [rowKey(r), JSON.stringify(r)])))
    setSaveErrors(new Map())
    setSummary(null)
  }, [query.data])

  // Pending write operations: changed existing rows (update) + non-blank new
  // rows (create). Blank appended rows are ignored until the user fills them.
  const pending = useMemo(
    () => computePendingOps(records, original),
    [records, original]
  )

  const cellErrors = useCallback(
    (rowIndex: number): FieldErrors | undefined => {
      const row = records[rowIndex]
      return row ? saveErrors.get(rowKey(row)) : undefined
    },
    [records, saveErrors]
  )

  const handleAddRows = useCallback(() => {
    setRecords((prev) => {
      const blanks = Array.from({ length: ADD_ROW_COUNT }, (_, i) =>
        makeBlankRecord(`${NEW_PREFIX}${newCounter + i}`)
      )
      return [...prev, ...blanks]
    })
    setNewCounter((n) => n + ADD_ROW_COUNT)
  }, [newCounter])

  const handleSave = useCallback(async () => {
    if (pending.length === 0) return
    setSaving(true)
    setSummary(null)

    const resource = `thing/geothermal-well/${id}/records`
    const provider = dataProvider('geothermal')

    const results = await Promise.allSettled(
      pending.map((op) => {
        if (op.kind === 'create') {
          // Server assigns OBJECTID — omit the temp id from the payload.
          const { OBJECTID: _tempId, ...variables } = op.row
          return provider.create({ resource, variables })
        }
        return provider.update({
          resource,
          id: op.row.OBJECTID,
          variables: op.row,
        })
      })
    )

    const createdByIndex = new Map<number, IWellRecord>()
    const nextSnaps: Array<[string, string]> = []
    const nextErrors = new Map<string, FieldErrors>()
    let saved = 0
    let failed = 0

    results.forEach((res, i) => {
      const op = pending[i]
      if (res.status === 'fulfilled') {
        saved++
        if (op.kind === 'create') {
          // Adopt the server record (real OBJECTID) so the row stops being new.
          const created = (res.value?.data as IWellRecord) ?? op.row
          createdByIndex.set(op.index, created)
          nextSnaps.push([rowKey(created), JSON.stringify(created)])
        } else {
          nextSnaps.push([op.key, JSON.stringify(op.row)])
        }
      } else {
        failed++
        const fe = flattenFieldErrors(
          (res.reason as { fieldErrors?: unknown })?.fieldErrors
        )
        if (fe) nextErrors.set(op.key, fe)
      }
    })

    if (createdByIndex.size > 0) {
      setRecords((prev) =>
        prev.map((r, i) => createdByIndex.get(i) ?? r)
      )
    }
    setOriginal((prev) => {
      const next = new Map(prev)
      nextSnaps.forEach(([k, v]) => next.set(k, v))
      return next
    })
    setSaveErrors(nextErrors)
    setSummary({ saved, failed })
    setSaving(false)
  }, [pending, id, dataProvider])

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
        You need the Geothermal Admin role to enter well data.
      </div>
    )
  }

  const pendingCount = pending.length

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2 pt-6">
        <span className="text-2xl font-black mr-2">Well records</span>
        {id != null && (
          <span className="text-sm text-muted-foreground">
            Well {String(id)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {summary && (
            <span
              className={
                summary.failed > 0
                  ? 'text-sm text-destructive'
                  : 'text-sm text-muted-foreground'
              }
            >
              {summary.saved} saved
              {summary.failed > 0 ? `, ${summary.failed} failed` : ''}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {pendingCount} unsaved {pendingCount === 1 ? 'change' : 'changes'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRows}
            disabled={saving}
          >
            Add {ADD_ROW_COUNT} rows
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || pendingCount === 0}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      <EditableDataGrid
        columns={RECORD_COLUMNS}
        rows={records}
        onRowsChange={setRecords}
        cellErrors={cellErrors}
        isLoading={query.isLoading}
        loadingMessage="Loading records…"
        freezeColumns={1}
      />
    </div>
  )
}
