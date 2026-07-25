import Papa from 'papaparse'
import {
  ALL_FIELDS,
  NUMBER_FIELDS,
  type WellDraft,
} from './inventoryFields'

const NUMBER_FIELD_SET = new Set<string>(NUMBER_FIELDS as string[])

// Canonical field name for a CSV header, matched case-insensitively and
// trimmed. Returns undefined for headers that aren't well fields.
const fieldForHeader = (() => {
  const byLower = new Map<string, keyof WellDraft>()
  for (const f of ALL_FIELDS) byLower.set(f.toLowerCase(), f)
  return (header: string): keyof WellDraft | undefined =>
    byLower.get(header.trim().toLowerCase())
})()

export interface CsvParseResult {
  rows: WellDraft[]
  /** Headers in the file that aren't recognized well fields. */
  unknownHeaders: string[]
  /** Number of malformed rows papaparse reported. */
  errorCount: number
}

/**
 * Map parsed CSV records (header→value objects) to well drafts. Recognized
 * headers become fields (numbers coerced; unparseable numbers dropped);
 * unknown headers are collected. Fully-empty rows are skipped. Pure — unit
 * tested without a File.
 */
export function mapRecordsToDrafts(
  records: Record<string, string>[],
  headers: string[]
): { rows: WellDraft[]; unknownHeaders: string[] } {
  const unknownHeaders = headers.filter((h) => !fieldForHeader(h))

  const rows: WellDraft[] = []
  for (const record of records) {
    const draft: WellDraft = {}
    let hasValue = false
    for (const [header, raw] of Object.entries(record)) {
      const field = fieldForHeader(header)
      if (!field) continue
      const value = (raw ?? '').trim()
      if (value === '') continue
      if (NUMBER_FIELD_SET.has(field)) {
        const n = Number(value)
        if (Number.isNaN(n)) continue
        ;(draft as Record<string, unknown>)[field] = n
      } else {
        ;(draft as Record<string, unknown>)[field] = value
      }
      hasValue = true
    }
    if (hasValue) rows.push(draft)
  }

  return { rows, unknownHeaders }
}

/** Parse a CSV File into well drafts. */
export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? []
        const { rows, unknownHeaders } = mapRecordsToDrafts(
          results.data,
          headers
        )
        resolve({ rows, unknownHeaders, errorCount: results.errors.length })
      },
      error: (err) => reject(err),
    })
  })
}

/** CSV header row (canonical field names) for the download template. */
export function buildTemplateCsv(): string {
  return Papa.unparse({ fields: ALL_FIELDS as string[], data: [] })
}
