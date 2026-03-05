import { APP_TIMEZONE } from '@/config'

export const formatAppDateTime = (
  isoUtc: string | null | undefined
): string => {
  if (!isoUtc) return ''
  const d = new Date(isoUtc)
  if (Number.isNaN(d.getTime())) return ''

  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

// Date only -- for fields like first_visit_date and well_completion_date
// where the time component is not meaningful.
export const formatAppDate = (
  isoDate: string | null | undefined
): string => {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''

  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}
