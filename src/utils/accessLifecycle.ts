/**
 * The date-window lifecycle shared by permission grants and publication
 * consent.
 *
 * Both rows carry `starts_at`, a nullable `ends_at`, and a nullable
 * `revoked_at`, and neither stores a status: what the row means depends on
 * the day it is read. Deriving it in one place keeps the grants tab and the
 * consent tab from drifting on what "expired" means.
 */

export type AccessStatus = 'active' | 'scheduled' | 'expired' | 'revoked'

export type LifecycleRow = {
  starts_at: string
  ends_at: string | null
  revoked_at: string | null
}

const dayOf = (value: string): string => value.slice(0, 10)

export const accessStatusOf = (
  row: LifecycleRow,
  today: Date
): AccessStatus => {
  if (row.revoked_at) return 'revoked'

  const day = dayOf(today.toISOString())
  if (dayOf(row.starts_at) > day) return 'scheduled'
  if (row.ends_at && dayOf(row.ends_at) < day) return 'expired'

  return 'active'
}

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  revoked: 'Revoked',
}

export const ACCESS_STATUS_COLORS: Record<
  AccessStatus,
  'success' | 'info' | 'default' | 'error'
> = {
  active: 'success',
  scheduled: 'info',
  expired: 'default',
  revoked: 'error',
}

/** Only a live or not-yet-started row is worth revoking. */
export const isRevocable = (row: LifecycleRow, today: Date): boolean => {
  const status = accessStatusOf(row, today)
  return status === 'active' || status === 'scheduled'
}

const STATUS_ORDER: Record<AccessStatus, number> = {
  active: 0,
  scheduled: 1,
  expired: 2,
  revoked: 3,
}

/**
 * Live rows first, then the ones that have not started, then history. Within
 * a status the newest start date leads: an admin reading these pages is
 * asking "what is in force now", not "what happened first".
 */
export const compareByLifecycle = (
  a: LifecycleRow,
  b: LifecycleRow,
  today: Date
): number =>
  STATUS_ORDER[accessStatusOf(a, today)] -
    STATUS_ORDER[accessStatusOf(b, today)] ||
  b.starts_at.localeCompare(a.starts_at)

/** `YYYY-MM-DD` for a date input, in local time rather than UTC. */
export const toDateInputValue = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export type LifecycleFormErrors = { ends_at?: string }

export const validateDateWindow = (form: {
  starts_at: string
  ends_at: string
}): LifecycleFormErrors =>
  form.ends_at && form.starts_at && form.ends_at < form.starts_at
    ? { ends_at: 'End date cannot fall before the start date.' }
    : {}
