/**
 * Local, per-browser preferences.
 *
 * These are not account settings: there is no API for user preferences, so
 * everything here lives in localStorage and applies to this browser only. The
 * store exists so a preference can be changed on the settings page and take
 * effect in the shell immediately, without threading a context through every
 * component that reads one.
 */

export const PREFERENCE_KEYS = {
  /** Collapse the sidebar on arrival at the map, to maximise the canvas. */
  autoCollapseSidebarOnMap: 'ocotillo.pref.autoCollapseSidebarOnMap',
} as const

export type PreferenceKey =
  (typeof PREFERENCE_KEYS)[keyof typeof PREFERENCE_KEYS]

const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) listener()
}

export const subscribeToPreferences = (listener: () => void): (() => void) => {
  listeners.add(listener)
  // Another tab writing the same key should move this one too.
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith('ocotillo.pref.')) listener()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * Anything unparseable falls back rather than throwing: a preference is never
 * important enough to break the page that reads it.
 */
export const readBooleanPreference = (
  key: PreferenceKey,
  fallback: boolean
): boolean => {
  try {
    const stored = localStorage.getItem(key)
    if (stored === 'true') return true
    if (stored === 'false') return false
    return fallback
  } catch {
    return fallback
  }
}

export const writeBooleanPreference = (
  key: PreferenceKey,
  value: boolean
): void => {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // A full or blocked localStorage should not break the toggle that set it.
  }
  notify()
}
