import { APP_TIMEZONE } from '@/config'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

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
    timeZoneName: 'short',
  }).format(d)
}

// Date only -- for fields like first_visit_date and well_completion_date
// where the time component is not meaningful.
// Handles both YYYY-MM-DD strings (parsed as UTC noon to avoid timezone shift)
// and full ISO datetime strings.
export const formatAppDate = (value: string | null | undefined): string => {
  if (!value) return ''

  const dateOnlyMatch = value.match(DATE_ONLY_PATTERN)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const d = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 12)
    )

    return new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d)
  }

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}
