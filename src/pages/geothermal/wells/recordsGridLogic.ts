import type { IWellRecord } from '@/interfaces/geothermal'

/**
 * Whether to bypass the Geothermal.Admin gate. True only in local dev
 * (`vite` dev server / vitest); production builds (`vite build`) set
 * `import.meta.env.DEV` to false, so the gate stays enforced when deployed.
 */
export const BYPASS_GEOTHERMAL_GATE = import.meta.env.DEV === true

/** Admins can always enter data; locally the gate is bypassed for testing. */
export function canEnterGeothermalData(canManageGeothermal: boolean): boolean {
  return canManageGeothermal || BYPASS_GEOTHERMAL_GATE
}

// Editable field keys (everything except the server-assigned OBJECTID).
export const EDITABLE_KEYS: (keyof IWellRecord)[] = [
  'WellDataID',
  'WellName',
  'WellNumber',
  'API_suffix',
  'ActionDate',
  'EntryDate',
  'EnteredBy',
  'RecrdSetID',
  'SourceID',
  'Comments',
]

// New rows carry a client-only temp id (`new:N`) in OBJECTID until the server
// assigns a real one on create. The prefix distinguishes create from update.
export const NEW_PREFIX = 'new:'

export function rowKey(r: IWellRecord): string {
  return String(r.OBJECTID)
}

export function isNewRow(r: IWellRecord): boolean {
  return rowKey(r).startsWith(NEW_PREFIX)
}

export function isBlankNew(r: IWellRecord): boolean {
  return EDITABLE_KEYS.every((k) => !r[k])
}

export function makeBlankRecord(tempId: string): IWellRecord {
  return {
    OBJECTID: tempId,
    WellDataID: '',
    WellName: '',
    WellNumber: '',
    API_suffix: '',
    ActionDate: '',
    EntryDate: '',
    EnteredBy: '',
    RecrdSetID: '',
    SourceID: '',
    Comments: '',
  }
}

/** Refine's `fieldErrors` ({ field: [msg] }) flattened to { field: joinedMsg }. */
export type FieldErrors = Record<string, string>

export function flattenFieldErrors(raw: unknown): FieldErrors | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: FieldErrors = {}
  for (const [field, msgs] of Object.entries(raw as Record<string, unknown>)) {
    out[field] = Array.isArray(msgs) ? msgs.join(' ') : String(msgs)
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export type PendingOp = {
  kind: 'create' | 'update'
  index: number
  key: string
  row: IWellRecord
}

/**
 * Split the current rows into pending write operations against the last-saved
 * snapshot: changed existing rows → `update`, non-blank new rows → `create`.
 * Blank appended rows and unchanged existing rows produce no op.
 */
export function computePendingOps(
  records: IWellRecord[],
  original: Map<string, string>
): PendingOp[] {
  const ops: PendingOp[] = []
  records.forEach((r, index) => {
    const key = rowKey(r)
    if (isNewRow(r)) {
      if (!isBlankNew(r)) ops.push({ kind: 'create', index, key, row: r })
    } else {
      const snap = original.get(key)
      if (snap !== undefined && snap !== JSON.stringify(r)) {
        ops.push({ kind: 'update', index, key, row: r })
      }
    }
  })
  return ops
}
