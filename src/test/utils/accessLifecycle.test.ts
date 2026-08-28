import { describe, expect, it } from 'vitest'
import {
  accessStatusOf,
  compareByLifecycle,
  isRevocable,
  type LifecycleRow,
  toDateInputValue,
  validateDateWindow,
} from '@/utils/accessLifecycle'

const row = (overrides: Partial<LifecycleRow> = {}): LifecycleRow => ({
  starts_at: '2026-01-01',
  ends_at: null,
  revoked_at: null,
  ...overrides,
})

const today = new Date('2026-06-15T12:00:00Z')

describe('accessStatusOf', () => {
  it('is active inside an open-ended window', () => {
    expect(accessStatusOf(row(), today)).toBe('active')
  })

  it('is scheduled before the start date', () => {
    expect(accessStatusOf(row({ starts_at: '2026-09-01' }), today)).toBe(
      'scheduled'
    )
  })

  it('is expired after the end date', () => {
    expect(accessStatusOf(row({ ends_at: '2026-05-31' }), today)).toBe(
      'expired'
    )
  })

  it('is active on the end date itself', () => {
    expect(accessStatusOf(row({ ends_at: '2026-06-15' }), today)).toBe('active')
  })

  it('reports revoked ahead of any date reasoning', () => {
    expect(
      accessStatusOf(
        row({ starts_at: '2026-09-01', revoked_at: '2026-06-01T00:00:00Z' }),
        today
      )
    ).toBe('revoked')
  })
})

describe('isRevocable', () => {
  it('allows revoking active and scheduled rows', () => {
    expect(isRevocable(row(), today)).toBe(true)
    expect(isRevocable(row({ starts_at: '2026-09-01' }), today)).toBe(true)
  })

  it('refuses expired and already-revoked rows', () => {
    expect(isRevocable(row({ ends_at: '2026-01-02' }), today)).toBe(false)
    expect(
      isRevocable(row({ revoked_at: '2026-02-02T00:00:00Z' }), today)
    ).toBe(false)
  })
})

describe('compareByLifecycle', () => {
  it('orders active, scheduled, expired, revoked', () => {
    const rows = [
      row({ revoked_at: '2026-03-01T00:00:00Z' }),
      row({ ends_at: '2026-02-01' }),
      row({ starts_at: '2026-12-01' }),
      row(),
    ].sort((a, b) => compareByLifecycle(a, b, today))

    expect(rows.map((entry) => accessStatusOf(entry, today))).toEqual([
      'active',
      'scheduled',
      'expired',
      'revoked',
    ])
  })

  it('puts the newest start date first within a status', () => {
    const rows = [
      row({ starts_at: '2026-01-01' }),
      row({ starts_at: '2026-05-01' }),
    ].sort((a, b) => compareByLifecycle(a, b, today))

    expect(rows.map((entry) => entry.starts_at)).toEqual([
      '2026-05-01',
      '2026-01-01',
    ])
  })
})

describe('validateDateWindow', () => {
  it('rejects an end date before the start date', () => {
    expect(
      validateDateWindow({ starts_at: '2026-06-01', ends_at: '2026-05-01' })
    ).toHaveProperty('ends_at')
  })

  it('accepts an open-ended window', () => {
    expect(
      validateDateWindow({ starts_at: '2026-06-01', ends_at: '' })
    ).toEqual({})
  })
})

describe('toDateInputValue', () => {
  it('formats a date for a date input', () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
