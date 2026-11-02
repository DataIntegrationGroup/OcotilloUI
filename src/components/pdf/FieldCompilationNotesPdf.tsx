import type { BaseRecord } from '@refinedev/core'
import type { IPdfDensity } from '@/interfaces'
import type { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'

/**
 * Direction notes region value (BDMS-1509). Re-exported for backward compatibility;
 * the canonical source is `page.tsx` now.
 */
export const directionNotesValue = (directionNotes?: string | null): string => {
  if (!directionNotes) return ''
  const trimmed = directionNotes.trim()
  return trimmed === '' ? '' : trimmed
}

/**
 * PDF document wrapper — delegates to the full implementation in page.tsx which handles
 * Document construction, multi-page layout, and all content rendering.
 * (Step 3–4: orchestration-only re-export.)
 */
import { FieldCompilationNotesPdf as _FieldCompilationNotesPdf } from './fieldCompilation/page'

export const FieldCompilationNotesPdf = _FieldCompilationNotesPdf
