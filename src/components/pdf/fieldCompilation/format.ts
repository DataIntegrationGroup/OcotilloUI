import { formatAddress, formatAppDate } from '@/utils'
import type { IContact, IWell, IObservation } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'

// ── Re-exported external formatters (used by component and tests) ───────────

export { formatAddress, formatAppDate }

/**
 * Formats contact phone numbers into a comma-separated string.
 */
export const formatContactPhones = (contacts: IContact[]) => {
  const phoneNumbers = contacts
    .flatMap((contact) => contact.phones ?? [])
    .filter(Boolean)
  return phoneNumbers.length > 0 ? phoneNumbers.join(', ') : '-'
}

// ── Pure value renderers ────────────────────────────────────────────────────

/**
 * Renders a value as string, falling back to emptyPlaceholder.
 */
export const renderValue = (value: unknown, empty = '-') => {
  if (value == null || value === '') return empty
  return String(value)
}

/**
 * Formats a numeric value with fixed decimal places.
 */
export const formatNumeric = (
  value: number | null | undefined,
  fractionDigits = 2,
  empty = '-'
): string => {
  if (value == null || Number.isNaN(value)) return empty
  return value.toFixed(fractionDigits)
}

// ── Text formatting helpers ─────────────────────────────────────────────────

export const notesToText = (
  notes: Array<
    { content?: string | null; created_at?: string | null } | null | undefined
  >,
  options?: {
    sortByCreatedAt?: boolean
    compact?: boolean
  }
) => {
  const values = [...notes]
    .filter(Boolean)
    .sort((a, b) => {
      if (!options?.sortByCreatedAt) return 0
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0
      return aTime - bTime
    })
    .map((note) =>
      note?.content?.replace(/\s+/g, options?.compact ? ' ' : ' ').trim()
    )
    .filter((value): value is string => Boolean(value))

  if (values.length === 0) return '-'

  return options?.compact ? values.join(' | ') : values.join('\n')
}

/**
 * Direction notes region value (BDMS-1509). The data source is still open
 * (Q17), so this never parses or infers a direction from any other field — it
 * only forwards what the caller supplied, and collapses anything undefined,
 * null, or blank to an empty string. That keeps the label printing with nothing
 * beneath it (empty, not missing) and never returns a placeholder like 'N/A'
 * or '-'. Exported for tests and other display-only callers.
 */
export const directionNotesValue = (directionNotes?: string | null): string => {
  if (!directionNotes) return ''
  const trimmed = directionNotes.trim()
  return trimmed === '' ? '' : trimmed
}

// ── Well/site data helpers ──────────────────────────────────────────────────

export const siteNameFromAlternateIds = (well: IWell): string => {
  const preferred =
    well.alternate_ids?.find(
      (alt) =>
        alt.relation?.toLowerCase() === 'same_as' &&
        alt.alternate_organization?.toLowerCase() === 'nmbgmr'
    )?.alternate_id ?? null

  return preferred ?? well.alternate_ids?.[0]?.alternate_id ?? '-'
}

export const locationNotesText = (well: IWell) =>
  notesToText(
    (well.current_location?.properties?.notes ?? []).filter(
      (note: any) => note?.note_type === 'General'
    )
  )

export const contactEmail = (contact?: IContact) => contact?.emails?.[0]?.email ?? '-'

export const contactAddress = (contact?: IContact) => {
  const address = contact?.addresses?.[0]
  return address ? formatAddress(address) : '-'
}

export const equipmentNotesText = (rows: SensorDeploymentRow[]) => {
  const notes = rows
    .map((row) => row.notes?.trim())
    .filter((note): note is string => Boolean(note && note !== '-'))
  return notes.length > 0 ? Array.from(new Set(notes)).join('\n') : '-'
}

/**
 * Site Notes field value — reads from the note array at
 * `well.site_notes` (legacy) or `well.notes`, joined as a single
 * text block. Falls back to `-` when empty.
 */
export const siteNotesText = (well: IWell): string => {
  const sn = (well.site_notes as any) || []
  const nt = (well.notes as any) || []
  const notes =
    sn.length > 0
      ? sn
      : nt.length > 0
        ? nt
        : []
  const lines = notes
    .map((n: any) => n?.content?.trim())
    .filter((c: string) => c)
  return lines.length > 0 ? lines.join('\n') : '-'
}

// ── Measurement row builders ────────────────────────────────────────────────

export const lastMeasurementsRows = (
  observations: readonly Partial<IObservation>[],
  sampleMethodsBySampleId: Record<number, string>
) =>
  [...observations]
    .filter((observation) => observation.observation_datetime)
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() -
        new Date(a.observation_datetime!).getTime()
    )
    .slice(0, 2)
    .map((observation) => ({
      date: formatAppDate(observation.observation_datetime),
      dtw:
        observation.depth_to_water_bgs != null
          ? formatNumeric(observation.depth_to_water_bgs)
          : '-',
      mpHeight:
        observation.measuring_point_height != null
          ? formatNumeric(observation.measuring_point_height)
          : '-',
      method:
        (observation.sample_id != null
          ? sampleMethodsBySampleId[observation.sample_id]
          : null) ?? '-',
      status:
        observation.groundwater_level_reason ?? observation.level_status ?? '-',
      staff: '-',
    }))

export const manualMeasurementRows = (
  observations: readonly Partial<IObservation>[]
) =>
  [...observations]
    .filter((observation) => observation.observation_datetime)
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() -
        new Date(a.observation_datetime!).getTime()
    )
    .slice(0, 20)
    .map((observation) => ({
      date: formatAppDate(observation.observation_datetime),
      dtw:
        observation.depth_to_water_bgs != null
          ? formatNumeric(observation.depth_to_water_bgs)
          : '-',
      mpHeight:
        observation.measuring_point_height != null
          ? formatNumeric(observation.measuring_point_height)
          : '-',
      status:
        observation.groundwater_level_reason ?? observation.level_status ?? '-',
      staff: '-',
    }))
