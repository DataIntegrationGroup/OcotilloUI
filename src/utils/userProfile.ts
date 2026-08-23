import type { PortalRole } from '@/utils/accessControl'

/**
 * Presentation helpers for the settings page. Everything here is pure so the
 * page itself stays a thin arrangement of components — the parts worth testing
 * are the fallbacks, which is where identity data actually varies.
 */

export type ColorModePreference = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'

export const COLOR_MODE_STORAGE_KEY = 'colorMode'

export const isColorModePreference = (
  value: unknown
): value is ColorModePreference =>
  value === 'light' || value === 'dark' || value === 'system'

/**
 * "System" is a preference, not a mode: it resolves against the OS setting at
 * render time and has to keep resolving as that setting changes.
 */
export const resolveColorMode = (
  preference: ColorModePreference,
  systemPrefersDark: boolean
): ResolvedColorMode => {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

/**
 * Two letters for the avatar block. Names arrive from the id token in whatever
 * shape the identity provider has, so anything unusable falls back to "?".
 */
export const initialsFromName = (name: string | undefined | null): string => {
  const parts = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return parts ? parts.toUpperCase() : '?'
}

export type RoleGroup = {
  portal: string
  roles: PortalRole[]
}

const PORTAL_LABELS: Record<string, string> = {
  AMP: 'Aquifer Mapping Program',
  Geothermal: 'Geothermal',
}

/**
 * Groups the flat role list by the portal prefix the roles carry, so the page
 * can show "Aquifer Mapping Program: Viewer, Editor" rather than six chips
 * that all repeat their own prefix.
 */
export const groupRolesByPortal = (roles: PortalRole[]): RoleGroup[] => {
  const byPortal = new Map<string, PortalRole[]>()

  for (const role of roles) {
    const [prefix] = role.split('.')
    const existing = byPortal.get(prefix)
    if (existing) existing.push(role)
    else byPortal.set(prefix, [role])
  }

  return [...byPortal.entries()].map(([prefix, portalRoles]) => ({
    portal: PORTAL_LABELS[prefix] ?? prefix,
    roles: portalRoles,
  }))
}

/** "AMP.Editor" reads as "Editor" once the portal is the row label. */
export const roleShortLabel = (role: PortalRole): string =>
  role.split('.')[1] ?? role

/**
 * How long the current session has left, from the id token's `exp` claim.
 * Returns null when there is no usable expiry rather than guessing, so the
 * page can omit the row instead of showing a wrong time.
 */
export const formatSessionExpiry = (
  expSeconds: number | undefined | null,
  now: Date
): string | null => {
  if (!expSeconds || !Number.isFinite(expSeconds)) return null

  const remainingMs = expSeconds * 1000 - now.getTime()
  if (remainingMs <= 0) return 'Expired — you will be signed out shortly'

  const minutes = Math.round(remainingMs / 60000)
  if (minutes < 1) return 'Expires in under a minute'
  if (minutes < 60)
    return `Expires in ${minutes} minute${minutes === 1 ? '' : 's'}`

  const hours = Math.floor(minutes / 60)
  const leftoverMinutes = minutes % 60
  const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`
  if (leftoverMinutes === 0) return `Expires in ${hourLabel}`

  return `Expires in ${hourLabel} ${leftoverMinutes} minute${
    leftoverMinutes === 1 ? '' : 's'
  }`
}
