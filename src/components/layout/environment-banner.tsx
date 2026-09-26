import { cn } from '@/lib/utils'

/**
 * Full-width environment banner shown at the very top of the app, above the navigation bar.
 * Mirrors the API's `environment_label()` contract: "STAGING" / "PRODUCTION" / "UNKNOWN".
 *
 * Deliberately rendered OUTSIDE the main UI chrome as a distinct full-width strip (BDMS-587:
 * Jake's report — the indicator should be a full-page banner, not inline in the header). It has
 * no hover state or click handler, so it never looks interactive. Hidden entirely on production
 * (AC #2: "The indicator does NOT appear on production").
 */
export function EnvironmentBanner() {
  // Read fresh on each render so the banner always reflects the current build/runtime env.
  const appEnv = (import.meta.env.VITE_APP_ENV || 'production').toLowerCase().trim()

  // AC #2: no banner at all in production — not even a quiet one.
  if (appEnv === 'production') {
    return null
  }

  const isStaging = appEnv === 'staging'
  const label = isStaging ? 'STAGING' : appEnv.toUpperCase()

  return (
    <div
      role="status"
      aria-label={`Current environment: ${label}`}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold tracking-wide',
        isStaging
          ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-gray-900'
          : 'bg-muted text-foreground'
      )}
    >
      <span className="uppercase">{label}</span>
    </div>
  )
}
