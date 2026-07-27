import Papa from 'papaparse'
import type { ITempDepthPoint } from '@/interfaces/geothermal'
import {
  type CellValue,
  type GridColumnSpec,
} from '@/components/grid'

export interface TempDepthFieldSpec {
  id: keyof ITempDepthPoint
  header: string
  description: string
  kind: 'number' | 'text'
}

// Columns of a temp-depth log. depth_ft + temp are the essential measurement;
// resistance/gradient/comment are supporting. PROVISIONAL names.
export const TEMP_DEPTH_SPECS: TempDepthFieldSpec[] = [
  { id: 'depth_m', header: 'Depth (m)', description: 'Measurement depth, meters', kind: 'number' },
  { id: 'depth_ft', header: 'Depth (ft)', description: 'Measurement depth, feet', kind: 'number' },
  { id: 'temp_f', header: 'Temp (°F)', description: 'Temperature, °F', kind: 'number' },
  { id: 'temp_c', header: 'Temp (°C)', description: 'Temperature, °C', kind: 'number' },
  { id: 'resistance', header: 'Resistance', description: 'Probe resistance', kind: 'number' },
  { id: 'gradient_c_km', header: 'Gradient (°C/km)', description: 'Thermal gradient, °C/km', kind: 'number' },
  { id: 'comment', header: 'Comment', description: 'Notes (e.g. formation, screen)', kind: 'text' },
]

export const TEMP_DEPTH_FIELDS: (keyof ITempDepthPoint)[] = TEMP_DEPTH_SPECS.map(
  (s) => s.id
)
const NUMBER_FIELDS = new Set<keyof ITempDepthPoint>(
  TEMP_DEPTH_SPECS.filter((s) => s.kind === 'number').map((s) => s.id)
)

export function makeBlankPoint(): ITempDepthPoint {
  return {
    depth_m: null,
    depth_ft: null,
    temp_f: null,
    temp_c: null,
    resistance: null,
    gradient_c_km: null,
    comment: null,
  }
}

export function isBlankPoint(p: ITempDepthPoint): boolean {
  return TEMP_DEPTH_FIELDS.every((k) => {
    const v = p[k]
    return v == null || v === ''
  })
}

/** Grid columns for the temp-depth log. */
export const TEMP_DEPTH_COLUMNS: GridColumnSpec<ITempDepthPoint>[] =
  TEMP_DEPTH_SPECS.map((spec) => ({
    id: spec.id,
    title: spec.header,
    tooltip: spec.description,
    width: spec.id === 'comment' ? 260 : 120,
    kind: spec.kind === 'number' ? 'number' : 'text',
    editable: true,
    getValue: (p) =>
      (p[spec.id] as CellValue) ?? (spec.kind === 'number' ? null : ''),
    setValue: (p, v) =>
      spec.kind === 'number'
        ? { ...p, [spec.id]: v as number | null }
        : { ...p, [spec.id]: v ?? null },
  }))

// CSV header → field, case-insensitive and trimmed. Accepts the legacy export
// headers (Depth_m, Temp_F, Gradient_C_km, …) and our snake_case ids.
const HEADER_ALIASES: Record<string, keyof ITempDepthPoint> = {
  depth_m: 'depth_m',
  'depth (m)': 'depth_m',
  depth_ft: 'depth_ft',
  'depth (ft)': 'depth_ft',
  temp_f: 'temp_f',
  'temp (°f)': 'temp_f',
  temp_c: 'temp_c',
  temp: 'temp_c',
  'temp (°c)': 'temp_c',
  resistance: 'resistance',
  gradient_c_km: 'gradient_c_km',
  'gradient (°c/km)': 'gradient_c_km',
  comment: 'comment',
  comments: 'comment',
}

function fieldForHeader(header: string): keyof ITempDepthPoint | undefined {
  return HEADER_ALIASES[header.trim().toLowerCase()]
}

export interface TempDepthCsvResult {
  points: ITempDepthPoint[]
  unknownHeaders: string[]
  errorCount: number
}

export function mapRecordsToPoints(
  records: Record<string, string>[],
  headers: string[]
): { points: ITempDepthPoint[]; unknownHeaders: string[] } {
  const unknownHeaders = headers.filter((h) => h.trim() && !fieldForHeader(h))
  const points: ITempDepthPoint[] = []
  for (const record of records) {
    const point = makeBlankPoint()
    let hasValue = false
    for (const [header, raw] of Object.entries(record)) {
      const field = fieldForHeader(header)
      if (!field) continue
      const value = (raw ?? '').trim()
      if (value === '') continue
      if (NUMBER_FIELDS.has(field)) {
        const n = Number(value)
        if (Number.isNaN(n)) continue
        ;(point as unknown as Record<string, unknown>)[field] = n
      } else {
        ;(point as unknown as Record<string, unknown>)[field] = value
      }
      hasValue = true
    }
    if (hasValue) points.push(point)
  }
  return { points, unknownHeaders }
}

export function parseTempDepthCsv(file: File): Promise<TempDepthCsvResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? []
        const { points, unknownHeaders } = mapRecordsToPoints(
          results.data,
          headers
        )
        resolve({ points, unknownHeaders, errorCount: results.errors.length })
      },
      error: (err) => reject(err),
    })
  })
}

export function buildTempDepthTemplate(): string {
  return Papa.unparse({ fields: TEMP_DEPTH_FIELDS as string[], data: [] })
}
