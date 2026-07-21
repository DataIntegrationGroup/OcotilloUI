import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDataProvider, useList, useParsed } from '@refinedev/core'
import type { IWellRecord } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import { EditableDataGrid, type GridColumnSpec } from '@/components/grid'
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

/** Refine's `fieldErrors` ({ field: [msg] }) flattened to { field: joinedMsg }. */
type FieldErrors = Record<string, string>

function flattenFieldErrors(raw: unknown): FieldErrors | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: FieldErrors = {}
  for (const [field, msgs] of Object.entries(raw as Record<string, unknown>)) {
    out[field] = Array.isArray(msgs) ? msgs.join(' ') : String(msgs)
  }
  return Object.keys(out).length > 0 ? out : undefined
}

interface SaveSummary {
  saved: number
  failed: number
}

/**
 * Phase 2/3 — inline-editable spreadsheet of the records belonging to one well,
 * with an explicit batch save.
 *
 * Reads `wells/{id}/records` through the geothermal provider and lets an admin
 * edit cells in place. Edits accumulate in local state and mark rows dirty. A
 * "Save changes" action flushes every dirty row through the provider `update`
 * (there is no server bulk endpoint), tracking success/failure per row:
 * saved rows clear their dirty flag; failed rows stay dirty for retry and have
 * their rejected cells tinted via the provider's Pydantic `fieldErrors`.
 * Admin-gated per BDMS-878 (`canManageGeothermal`).
 */
export const GeoThermalRecordsGrid = () => {
  const { id } = useParsed()
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()
  const dataProvider = useDataProvider()

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

  // Rows whose current value differs from the last-saved snapshot.
  const dirtyRows = useMemo(
    () =>
      records
        .map((r, index) => ({ r, index }))
        .filter(({ r }) => {
          const snap = original.get(rowKey(r))
          return snap !== undefined && snap !== JSON.stringify(r)
        }),
    [records, original]
  )

  const cellErrors = useCallback(
    (rowIndex: number): FieldErrors | undefined => {
      const row = records[rowIndex]
      return row ? saveErrors.get(rowKey(row)) : undefined
    },
    [records, saveErrors]
  )

  const handleSave = useCallback(async () => {
    if (dirtyRows.length === 0) return
    setSaving(true)
    setSummary(null)

    const resource = `wells/${id}/records`
    const provider = dataProvider('geothermal')

    const results = await Promise.allSettled(
      dirtyRows.map(({ r }) =>
        provider.update({ resource, id: r.OBJECTID, variables: r })
      )
    )

    setOriginal((prev) => {
      const next = new Map(prev)
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const row = dirtyRows[i].r
          next.set(rowKey(row), JSON.stringify(row))
        }
      })
      return next
    })

    const nextErrors = new Map<string, FieldErrors>()
    let saved = 0
    let failed = 0
    results.forEach((res, i) => {
      const key = rowKey(dirtyRows[i].r)
      if (res.status === 'fulfilled') {
        saved++
      } else {
        failed++
        const fe = flattenFieldErrors(
          (res.reason as { fieldErrors?: unknown })?.fieldErrors
        )
        if (fe) nextErrors.set(key, fe)
      }
    })

    setSaveErrors(nextErrors)
    setSummary({ saved, failed })
    setSaving(false)
  }, [dirtyRows, id, dataProvider])

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

  const dirtyCount = dirtyRows.length

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
            {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}
          </span>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
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
