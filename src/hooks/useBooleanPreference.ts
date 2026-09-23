import { useCallback, useSyncExternalStore } from 'react'
import {
  type PreferenceKey,
  readBooleanPreference,
  subscribeToPreferences,
  writeBooleanPreference,
} from '@/utils/preferences'

/**
 * Reads a localStorage-backed preference as React state. Every component using
 * the same key re-renders when any of them writes it, so the settings page and
 * the shell stay in step without a shared provider.
 */
export const useBooleanPreference = (
  key: PreferenceKey,
  fallback: boolean
): [boolean, (value: boolean) => void] => {
  const value = useSyncExternalStore(
    subscribeToPreferences,
    () => readBooleanPreference(key, fallback),
    () => fallback
  )

  const setValue = useCallback(
    (next: boolean) => writeBooleanPreference(key, next),
    [key]
  )

  return [value, setValue]
}
