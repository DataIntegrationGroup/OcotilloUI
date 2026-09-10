// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PREFERENCE_KEYS,
  readBooleanPreference,
  subscribeToPreferences,
  writeBooleanPreference,
} from '@/utils/preferences'

const KEY = PREFERENCE_KEYS.autoCollapseSidebarOnMap

describe('boolean preferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back when nothing is stored', () => {
    expect(readBooleanPreference(KEY, true)).toBe(true)
    expect(readBooleanPreference(KEY, false)).toBe(false)
  })

  it('round-trips both values', () => {
    writeBooleanPreference(KEY, false)
    expect(readBooleanPreference(KEY, true)).toBe(false)

    writeBooleanPreference(KEY, true)
    expect(readBooleanPreference(KEY, false)).toBe(true)
  })

  it('falls back on a value it did not write', () => {
    localStorage.setItem(KEY, 'yes please')

    expect(readBooleanPreference(KEY, true)).toBe(true)
    expect(readBooleanPreference(KEY, false)).toBe(false)
  })

  it('notifies subscribers on write, and stops after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToPreferences(listener)

    writeBooleanPreference(KEY, false)
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    writeBooleanPreference(KEY, true)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
