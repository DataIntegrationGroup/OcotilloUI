import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDataProvider, useList, useParsed } from '@refinedev/core'
import type { ITempDepthPoint } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import { EditableDataGrid } from '@/components/grid'
import { Button } from '@/components/ui/button'
import { canEnterGeothermalData } from './recordsGridLogic'
import {
  TEMP_DEPTH_COLUMNS,
  buildTempDepthTemplate,
  isBlankPoint,
  makeBlankPoint,
  parseTempDepthCsv,
} from './tempDepth'

const INITIAL_ROWS = 20
const ADD_ROW_COUNT = 20
const TEMPLATE_FILENAME = 'geothermal-temp-depth-template.csv'

function blankPoints(n: number): ITempDepthPoint[] {
  return Array.from({ length: n }, makeBlankPoint)
}

/**
 * G1 — Temperature-depth log for one geothermal well.
 *
 * The core geothermal measurement (depth vs temperature, from which thermal
 * gradient and heat flow derive). Points come from typing/pasting into the grid
 * or from a CSV upload (the legacy Depth/Temp export shape). "Save log" writes
 * the whole set to the well's temp-depth endpoint in one request. Admin-gated
 * per BDMS-878. PROVISIONAL — the backend endpoint isn't built yet.
 */
export const GeoThermalTempDepthGrid = () => {
  const { id } = useParsed()
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()
  const dataProvider = useDataProvider()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resource = `thing/geothermal-well/${id}/temp-depth`
  const { query } = useList<ITempDepthPoint>({
    resource,
    dataProviderName: 'geothermal',
    pagination: { pageSize: 5000, mode: 'server' },
    queryOptions: { enabled: canEnterGeothermalData(canManageGeothermal) && id != null },
  })

  const [points, setPoints] = useState<ITempDepthPoint[]>(() =>
    blankPoints(INITIAL_ROWS)
  )
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    const data = query.data?.data
    if (!data || data.length === 0) return
    setPoints([...data, ...blankPoints(3)])
  }, [query.data])

  const filledCount = useMemo(
    () => points.filter((p) => !isBlankPoint(p)).length,
    [points]
  )

  const handleAddRows = useCallback(
    () => setPoints((prev) => [...prev, ...blankPoints(ADD_ROW_COUNT)]),
    []
  )

  const handleDownloadTemplate = useCallback(() => {
    const blob = new Blob([buildTempDepthTemplate()], {
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
      event.target.value = ''
      if (!file) return
      try {
        const { points: parsed, unknownHeaders, errorCount } =
          await parseTempDepthCsv(file)
        setPoints([...parsed, ...blankPoints(3)])
        const notes = [`Loaded ${parsed.length} points`]
        if (unknownHeaders.length > 0) {
          notes.push(`ignored columns: ${unknownHeaders.join(', ')}`)
        }
        if (errorCount > 0) notes.push(`${errorCount} malformed rows skipped`)
        setStatus(notes.join(' · '))
      } catch {
        setStatus('Could not parse that CSV file.')
      }
    },
    []
  )

  const handleSave = useCallback(async () => {
    const toSave = points.filter((p) => !isBlankPoint(p))
    if (toSave.length === 0) return
    setSaving(true)
    setStatus(null)
    try {
      // Single batch write of the whole log (no per-point endpoint).
      await dataProvider('geothermal').create({
        resource,
        variables: { points: toSave },
      })
      setStatus(`Saved ${toSave.length} points`)
    } catch {
      setStatus('Save failed — temp-depth endpoint not available yet.')
    } finally {
      setSaving(false)
    }
  }, [points, dataProvider, resource])

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
        You need the Geothermal Admin role to enter temp-depth data.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2 pt-6">
        <span className="text-2xl font-black mr-2">Temp-depth log</span>
        {id != null && (
          <span className="text-sm text-muted-foreground">
            Well {String(id)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {status && (
            <span className="text-sm text-muted-foreground">{status}</span>
          )}
          <span className="text-sm text-muted-foreground">
            {filledCount} {filledCount === 1 ? 'point' : 'points'}
          </span>
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
            size="sm"
            onClick={handleSave}
            disabled={saving || filledCount === 0}
          >
            {saving ? 'Saving…' : 'Save log'}
          </Button>
        </div>
      </div>

      <EditableDataGrid
        columns={TEMP_DEPTH_COLUMNS}
        rows={points}
        onRowsChange={setPoints}
        rowMarkers="number"
        isLoading={query.isLoading}
        loadingMessage="Loading log…"
        freezeColumns={1}
      />
    </div>
  )
}
