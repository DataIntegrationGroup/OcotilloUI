import type { BaseRecord } from '@refinedev/core'
import type { IPdfDensity } from '@/interfaces'
import type { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'

/**
 * Re-export of the canonical `directionNotesValue` definition from format.ts.
 * Kept in the façade for backward compatibility with existing import paths.
 */
export { directionNotesValue } from './fieldCompilation/format'

/**
 * PDF document wrapper — delegates to the full implementation in page.tsx which handles
 * Document construction, multi-page layout, and all content rendering.
 * (Step 3–4: orchestration-only re-export.)
 */
import { FieldCompilationNotesPdf as _FieldCompilationNotesPdf } from './fieldCompilation/page'

export const FieldCompilationNotesPdf = _FieldCompilationNotesPdf
