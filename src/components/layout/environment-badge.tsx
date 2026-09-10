import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const appEnv = import.meta.env.VITE_APP_ENV || 'production'

/**
 * Persistent environment indicator shown in the header bar.
 * Mirrors the API's `environment_label()` contract: "STAGING" / "PRODUCTION" / "UNKNOWN".
 *
 * Hidden entirely on production so the badge never appears off-staging (BDMS-587 AC #2:
 * "The indicator does NOT appear on production"). Staging gets a bright, unmistakable amber
 * marker; any other env (preview, dev) shows its upper-cased name on the default variant.
 */
export function EnvironmentBadge() {
  // Read fresh on each render so the badge always reflects the current build/runtime env.
  const appEnv = (import.meta.env.VITE_APP_ENV || 'production').toLowerCase().trim()

  // AC #2: no indicator at all in production — not even a quiet one.
  if (appEnv === 'production') {
    return null
  }

  let label: string
  let variant: 'default' | 'destructive' | 'outline'

  if (appEnv === 'staging') {
    label = 'STAGING'
    variant = 'destructive' // amber/red — unmistakable
  } else {
    label = appEnv.toUpperCase()
    variant = 'default'
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        'font-bold tracking-wide',
        appEnv === 'staging' &&
          'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-gray-900'
      )}
    >
      {label}
    </Badge>
  )
}
