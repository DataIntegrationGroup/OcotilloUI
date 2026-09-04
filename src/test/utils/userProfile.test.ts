import { describe, expect, it } from 'vitest'
import type { PortalRole } from '@/utils/accessControl'
import {
  formatSessionExpiry,
  groupRolesByPortal,
  initialsFromName,
  isColorModePreference,
  resolveColorMode,
  roleShortLabel,
} from '@/utils/userProfile'

describe('resolveColorMode', () => {
  it('follows the OS only when the preference is "system"', () => {
    expect(resolveColorMode('system', true)).toBe('dark')
    expect(resolveColorMode('system', false)).toBe('light')
    expect(resolveColorMode('light', true)).toBe('light')
    expect(resolveColorMode('dark', false)).toBe('dark')
  })
})

describe('isColorModePreference', () => {
  it('rejects anything not a stored preference', () => {
    expect(isColorModePreference('light')).toBe(true)
    expect(isColorModePreference('dark')).toBe(true)
    expect(isColorModePreference('system')).toBe(true)
    expect(isColorModePreference('sepia')).toBe(false)
    expect(isColorModePreference(null)).toBe(false)
    expect(isColorModePreference(undefined)).toBe(false)
  })
})

describe('initialsFromName', () => {
  it('takes the first letter of the first two names', () => {
    expect(initialsFromName('Jake Ross')).toBe('JR')
    expect(initialsFromName('ada byron lovelace')).toBe('AB')
    expect(initialsFromName('Cher')).toBe('C')
  })

  it('falls back when the name is missing or blank', () => {
    expect(initialsFromName(undefined)).toBe('?')
    expect(initialsFromName(null)).toBe('?')
    expect(initialsFromName('   ')).toBe('?')
  })
})

describe('groupRolesByPortal', () => {
  it('groups by the portal prefix, in the order the roles arrive', () => {
    const roles: PortalRole[] = ['AMP.Viewer', 'AMP.Editor', 'Geothermal.Admin']

    expect(groupRolesByPortal(roles)).toEqual([
      {
        portal: 'Aquifer Mapping Program',
        roles: ['AMP.Viewer', 'AMP.Editor'],
      },
      { portal: 'Geothermal', roles: ['Geothermal.Admin'] },
    ])
  })

  it('returns nothing for an account with no roles', () => {
    expect(groupRolesByPortal([])).toEqual([])
  })
})

describe('roleShortLabel', () => {
  it('drops the portal prefix', () => {
    expect(roleShortLabel('AMP.Admin')).toBe('Admin')
    expect(roleShortLabel('Geothermal.Viewer')).toBe('Viewer')
  })
})

describe('formatSessionExpiry', () => {
  const now = new Date('2026-08-23T12:00:00Z')
  const inMinutes = (minutes: number) =>
    Math.floor(now.getTime() / 1000) + minutes * 60

  it('returns null when there is no usable expiry', () => {
    expect(formatSessionExpiry(undefined, now)).toBeNull()
    expect(formatSessionExpiry(null, now)).toBeNull()
    expect(formatSessionExpiry(Number.NaN, now)).toBeNull()
  })

  it('reports an expired token', () => {
    expect(formatSessionExpiry(inMinutes(-5), now)).toBe(
      'Expired — you will be signed out shortly'
    )
  })

  it('reports minutes, singular and plural', () => {
    expect(formatSessionExpiry(inMinutes(1), now)).toBe('Expires in 1 minute')
    expect(formatSessionExpiry(inMinutes(42), now)).toBe(
      'Expires in 42 minutes'
    )
  })

  it('reports hours, with and without leftover minutes', () => {
    expect(formatSessionExpiry(inMinutes(60), now)).toBe('Expires in 1 hour')
    expect(formatSessionExpiry(inMinutes(150), now)).toBe(
      'Expires in 2 hours 30 minutes'
    )
    expect(formatSessionExpiry(inMinutes(61), now)).toBe(
      'Expires in 1 hour 1 minute'
    )
  })

  it('handles the sub-minute case rather than rounding to zero', () => {
    expect(
      formatSessionExpiry(Math.floor(now.getTime() / 1000) + 20, now)
    ).toBe('Expires in under a minute')
  })
})
