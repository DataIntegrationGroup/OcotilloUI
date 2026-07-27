import { useCallback, useMemo, useRef, useState } from 'react'
import { useDataProvider } from '@refinedev/core'
import { useAccessCapabilities } from '@/hooks'
import {
  EditableDataGrid,
  type CellValue,
  type GridColumnSpec,
} from '@/components/grid'
import { Button } from '@/components/ui/button'
import {
  canEnterGeothermalData,
  flattenFieldErrors,
  type FieldErrors,
} from './recordsGridLogic'
import {
  FIELD_SPECS,
  type FieldSpec,
  cleanDraft,
  formatCoord,
  isBlankDraft,
  validateDraft,
  type WellDraft,
} from './inventoryFields'
import { buildTemplateCsv, parseCsvFile } from './inventoryCsv'
import { LocationPickerModal } from './LocationPickerModal'

// Build a grid column from a field spec, dispatching by kind.
function specToColumn(spec: FieldSpec): GridColumnSpec<WellDraft> {
  const id = spec.id
  const base = {
    id,
    title: spec.header,
    tooltip: spec.description,
    group: spec.group,
    editable: true,
  }
  if (spec.kind === 'boolean') {
    return {
      ...base,
      width: 90,
      kind: 'boolean',
      getValue: (r) => (r[id] as boolean | null) ?? false,
      setValue: (r, v) => ({ ...r, [id]: v === true }),
    }
  }
  if (spec.kind === 'dropdown') {
    return {
      ...base,
      width: 130,
      kind: 'dropdown',
      options: spec.options ?? [],
      getValue: (r) => (r[id] as CellValue) ?? '',
      setValue: (r, v) => ({ ...r, [id]: v ?? '' }),
    }
  }
  if (spec.kind === 'number') {
    return {
      ...base,
      width: 120,
      kind: 'number',
      getValue: (r) => (r[id] as CellValue) ?? null,
      setValue: (r, v) => ({ ...r, [id]: v as number | null }),
      // Coordinates display rounded; full precision kept for save.
      ...(spec.coord
        ? {
            format: (v: CellValue) =>
              typeof v === 'number' ? formatCoord(v) : '',
          }
        : {}),
    }
  }
  return {
    ...base,
    width: 150,
    getValue: (r) => (r[id] as CellValue) ?? '',
    setValue: (r, v) => ({ ...r, [id]: v ?? '' }),
  }
}

const COLUMNS: GridColumnSpec<WellDraft>[] = FIELD_SPECS.map(specToColumn)

interface CreateSummary {
  created: number
  failed: number
}

const INITIAL_ROWS = 10
const ADD_ROW_COUNT = 10
const TEMPLATE_FILENAME = 'geothermal-well-inventory-template.csv'
const DRAFT_KEY = 'geothermal:inventory:draft'

function blankRows(n: number): WellDraft[] {
  return Array.from({ length: n }, () => ({}))
}

// "Save for later" persistence — cache the non-blank rows in localStorage so
// entered/imported data survives navigation and reloads.
function loadDraft(): WellDraft[] | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as WellDraft[]
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null
}

function saveDraft(rows: WellDraft[]): number {
  const filled = rows.filter((r) => !isBlankDraft(r))
  try {
    if (filled.length > 0) localStorage.setItem(DRAFT_KEY, JSON.stringify(filled))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
  return filled.length
}

function hasDraft(): boolean {
  try {
    return localStorage.getItem(DRAFT_KEY) != null
  } catch {
    return false
  }
}

/**
 * P1/P2/P3 — Geothermal well inventory (direct grid entry + CSV load + batch
 * create).
 *
 * An editable spreadsheet for inventorying new geothermal wells. Rows come from
 * typing/pasting into blank rows ("Add rows"), or from an uploaded CSV
 * ("Upload CSV", with a matching "Download template"). "Create wells" POSTs
 * every non-blank draft through the geothermal provider (one request per row —
 * no server bulk endpoint), tracking success/failure per row: created wells
 * drop out of the grid, failed rows stay with their rejected cells tinted from
 * the provider's Pydantic `fieldErrors`. Dropdown/date/boolean editors +
 * client validation land in P4. Admin-gated per BDMS-878
 * (`canEnterGeothermalData`, bypassed in local dev).
 */
export const GeoThermalWellInventory = () => {
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()
  const dataProvider = useDataProvider()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rows, setRows] = useState<WellDraft[]>(() => {
    const draft = loadDraft()
    return draft ? [...draft, ...blankRows(3)] : blankRows(INITIAL_ROWS)
  })
  const [saving, setSaving] = useState(false)
  // Validation errors per current row index (from a rejected create).
  const [saveErrors, setSaveErrors] = useState<Map<number, FieldErrors>>(
    new Map()
  )
  const [summary, setSummary] = useState<CreateSummary | null>(null)
  const [csvStatus, setCsvStatus] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<string | null>(() => {
    const draft = loadDraft()
    return draft ? `Restored ${draft.length} saved rows` : null
  })
  // Row whose location is being picked on the map (null = closed).
  const [pickerRow, setPickerRow] = useState<number | null>(null)

  // A read-only "Location" column that opens the map picker for its row.
  const columns = useMemo<GridColumnSpec<WellDraft>[]>(
    () => [
      ...COLUMNS,
      {
        id: '__location',
        title: 'Pick',
        group: 'Location',
        tooltip: 'Pick the well location on a map',
        width: 140,
        getValue: (r) =>
          r.latitude != null && r.longitude != null
            ? `${formatCoord(r.latitude)}, ${formatCoord(r.longitude)}`
            : '📍 Pin on map',
        onClick: (_r, rowIndex) => setPickerRow(rowIndex),
      },
    ],
    []
  )

  const applyLocation = useCallback(
    (rowIndex: number, lat: number, lon: number) => {
      setRows((prev) =>
        prev.map((r, i) =>
          i === rowIndex ? { ...r, latitude: lat, longitude: lon } : r
        )
      )
    },
    []
  )

  const filledCount = useMemo(
    () => rows.filter((r) => !isBlankDraft(r)).length,
    [rows]
  )

  // Client-side validation: required-empty + per-field validators (e.g. API
  // format) on any non-blank row.
  const validationErrors = useMemo(() => {
    const map = new Map<number, FieldErrors>()
    rows.forEach((r, i) => {
      if (isBlankDraft(r)) return
      const errs = validateDraft(r)
      if (Object.keys(errs).length > 0) map.set(i, errs)
    })
    return map
  }, [rows])

  const invalidCount = validationErrors.size

  // Validation errors tint immediately; save (server) errors override them.
  const cellErrors = useCallback(
    (rowIndex: number): FieldErrors | undefined => {
      const validation = validationErrors.get(rowIndex)
      const save = saveErrors.get(rowIndex)
      if (!validation && !save) return undefined
      return { ...validation, ...save }
    },
    [validationErrors, saveErrors]
  )

  const handleAddRows = useCallback(
    () => setRows((prev) => [...prev, ...blankRows(ADD_ROW_COUNT)]),
    []
  )

  const handleSaveForLater = useCallback(() => {
    const n = saveDraft(rows)
    setCsvStatus(null)
    setSummary(null)
    setDraftStatus(
      n > 0 ? `Saved ${n} ${n === 1 ? 'row' : 'rows'} for later` : 'Nothing to save'
    )
  }, [rows])

  const handleDownloadTemplate = useCallback(() => {
    const blob = new Blob([buildTemplateCsv()], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = TEMPLATE_FILENAME
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleUploadCsv = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Reset so re-selecting the same file fires change again.
      event.target.value = ''
      if (!file) return

      setSummary(null)
      setSaveErrors(new Map())
      try {
        const { rows: parsed, unknownHeaders, errorCount } =
          await parseCsvFile(file)
        // Loaded rows plus a few blanks for further manual entry.
        setRows([...parsed, ...blankRows(3)])
        const notes: string[] = [`Loaded ${parsed.length} rows`]
        if (unknownHeaders.length > 0) {
          notes.push(`ignored columns: ${unknownHeaders.join(', ')}`)
        }
        if (errorCount > 0) notes.push(`${errorCount} malformed rows skipped`)
        setCsvStatus(notes.join(' · '))
      } catch {
        setCsvStatus('Could not parse that CSV file.')
      }
    },
    []
  )

  const handleCreate = useCallback(async () => {
    const pending = rows
      .map((r, index) => ({ r, index }))
      .filter(({ r }) => !isBlankDraft(r))
    if (pending.length === 0) return

    setSaving(true)
    setSummary(null)
    setCsvStatus(null)

    const provider = dataProvider('geothermal')
    const resource = 'thing/geothermal-well'
    const results = await Promise.allSettled(
      pending.map(({ r }) =>
        provider.create({ resource, variables: cleanDraft(r) })
      )
    )

    const succeeded = new Set<number>()
    const errorsByIndex = new Map<number, FieldErrors>()
    let created = 0
    let failed = 0
    results.forEach((res, k) => {
      const origIndex = pending[k].index
      if (res.status === 'fulfilled') {
        created++
        succeeded.add(origIndex)
      } else {
        failed++
        const fe = flattenFieldErrors(
          (res.reason as { fieldErrors?: unknown })?.fieldErrors
        )
        if (fe) errorsByIndex.set(origIndex, fe)
      }
    })

    // Drop created rows; keep blanks + failed rows, remapping errors to the
    // surviving rows' new indices.
    const nextRows: WellDraft[] = []
    const nextErrors = new Map<number, FieldErrors>()
    rows.forEach((r, i) => {
      if (succeeded.has(i)) return
      const fe = errorsByIndex.get(i)
      if (fe) nextErrors.set(nextRows.length, fe)
      nextRows.push(r)
    })

    setRows(nextRows.length > 0 ? nextRows : blankRows(INITIAL_ROWS))
    setSaveErrors(nextErrors)
    setSummary({ created, failed })
    setSaving(false)
    // Keep a saved draft in sync with what still needs creating.
    if (created > 0 && hasDraft()) saveDraft(nextRows)
  }, [rows, dataProvider])

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

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2 pt-6">
        <span className="text-2xl font-black mr-2">Well inventory</span>
        <span className="text-sm text-muted-foreground">
          Enter new geothermal wells
        </span>
        <div className="ml-auto flex items-center gap-3">
          {draftStatus && (
            <span className="text-sm text-muted-foreground">{draftStatus}</span>
          )}
          {csvStatus && (
            <span className="text-sm text-muted-foreground">{csvStatus}</span>
          )}
          {summary && (
            <span
              className={
                summary.failed > 0
                  ? 'text-sm text-destructive'
                  : 'text-sm text-muted-foreground'
              }
            >
              {summary.created} created
              {summary.failed > 0 ? `, ${summary.failed} failed` : ''}
            </span>
          )}
          {invalidCount > 0 ? (
            <span className="text-sm text-destructive">
              {invalidCount} {invalidCount === 1 ? 'row' : 'rows'} with errors
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {filledCount} {filledCount === 1 ? 'well' : 'wells'} to add
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadTemplate}
            disabled={saving}
          >
            Download template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            Upload CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleUploadCsv}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRows}
            disabled={saving}
          >
            Add {ADD_ROW_COUNT} rows
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveForLater}
            disabled={saving || filledCount === 0}
          >
            Save for later
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={saving || filledCount === 0 || invalidCount > 0}
          >
            {saving ? 'Creating…' : 'Create wells'}
          </Button>
        </div>
      </div>

      <EditableDataGrid
        columns={columns}
        rows={rows}
        onRowsChange={setRows}
        cellErrors={cellErrors}
        rowMarkers="number"
        freezeColumns={1}
      />

      {pickerRow !== null && (
        <LocationPickerModal
          key={pickerRow}
          lat={rows[pickerRow]?.latitude ?? null}
          lon={rows[pickerRow]?.longitude ?? null}
          onConfirm={(lat, lon) => {
            applyLocation(pickerRow, lat, lon)
            setPickerRow(null)
          }}
          onClose={() => setPickerRow(null)}
        />
      )}
    </div>
  )
}
