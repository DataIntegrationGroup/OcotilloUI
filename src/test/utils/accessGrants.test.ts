import { describe, expect, it } from 'vitest'
import {
  describeScope,
  grantQueryParams,
  grantStatusOf,
  isRevocable,
  isUnfiltered,
  type PermissionGrant,
  scopeIdRequired,
  sortGrants,
  toCreateGrantInput,
  toDateInputValue,
  validateGrantForm,
  zPermissionGrant,
} from '@/utils/accessGrants'

const grant = (overrides: Partial<PermissionGrant> = {}): PermissionGrant =>
  zPermissionGrant.parse({
    id: 1,
    principal_type: 'user',
    principal_id: 'ak-subject-1',
    capability: 'read',
    scope_type: 'global',
    scope_id: null,
    data_type: 'water level',
    starts_at: '2026-01-01',
    ends_at: null,
    granted_by: 'admin@example.org',
    reason: null,
    revoked_at: null,
    revoked_by: null,
    ...overrides,
  })

const today = new Date('2026-06-15T12:00:00Z')

describe('grantStatusOf', () => {
  it('is active inside an open-ended window', () => {
    expect(grantStatusOf(grant(), today)).toBe('active')
  })

  it('is scheduled before the start date', () => {
    expect(grantStatusOf(grant({ starts_at: '2026-09-01' }), today)).toBe(
      'scheduled'
    )
  })

  it('is expired after the end date', () => {
    expect(grantStatusOf(grant({ ends_at: '2026-05-31' }), today)).toBe(
      'expired'
    )
  })

  it('is active on the end date itself', () => {
    expect(grantStatusOf(grant({ ends_at: '2026-06-15' }), today)).toBe(
      'active'
    )
  })

  it('reports revoked ahead of any date reasoning', () => {
    expect(
      grantStatusOf(
        grant({ starts_at: '2026-09-01', revoked_at: '2026-06-01T00:00:00Z' }),
        today
      )
    ).toBe('revoked')
  })
})

describe('isRevocable', () => {
  it('allows revoking active and scheduled grants', () => {
    expect(isRevocable(grant(), today)).toBe(true)
    expect(isRevocable(grant({ starts_at: '2026-09-01' }), today)).toBe(true)
  })

  it('refuses expired and already-revoked grants', () => {
    expect(isRevocable(grant({ ends_at: '2026-01-02' }), today)).toBe(false)
    expect(
      isRevocable(grant({ revoked_at: '2026-02-02T00:00:00Z' }), today)
    ).toBe(false)
  })
})

describe('scope', () => {
  it('requires a scope id only for group and thing scopes', () => {
    expect(scopeIdRequired('global')).toBe(false)
    expect(scopeIdRequired('group')).toBe(true)
    expect(scopeIdRequired('thing')).toBe(true)
  })

  it('describes a scope with its id where one applies', () => {
    expect(describeScope(grant())).toBe('global')
    expect(describeScope(grant({ scope_type: 'thing', scope_id: 42 }))).toBe(
      'thing 42'
    )
  })
})

describe('sortGrants', () => {
  it('orders active, then scheduled, then expired, then revoked', () => {
    const rows = sortGrants(
      [
        grant({ id: 1, revoked_at: '2026-03-01T00:00:00Z' }),
        grant({ id: 2, ends_at: '2026-02-01' }),
        grant({ id: 3, starts_at: '2026-12-01' }),
        grant({ id: 4 }),
      ],
      today
    )

    expect(rows.map((row) => row.id)).toEqual([4, 3, 2, 1])
  })

  it('puts the newest start date first within a status', () => {
    const rows = sortGrants(
      [
        grant({ id: 1, starts_at: '2026-01-01' }),
        grant({ id: 2, starts_at: '2026-05-01' }),
      ],
      today
    )

    expect(rows.map((row) => row.id)).toEqual([2, 1])
  })
})

describe('validateGrantForm', () => {
  const form = {
    principal_id: 'ak-subject-1',
    scope_type: 'global',
    scope_id: '',
    starts_at: '2026-06-01',
    ends_at: '',
  }

  it('accepts a global grant with no scope id', () => {
    expect(validateGrantForm(form)).toEqual({})
  })

  it('requires a principal', () => {
    expect(validateGrantForm({ ...form, principal_id: '  ' })).toHaveProperty(
      'principal_id'
    )
  })

  it('requires a scope id for a thing-scoped grant', () => {
    expect(validateGrantForm({ ...form, scope_type: 'thing' })).toHaveProperty(
      'scope_id'
    )
  })

  it('rejects a non-numeric scope id', () => {
    expect(
      validateGrantForm({ ...form, scope_type: 'group', scope_id: 'abc' })
    ).toHaveProperty('scope_id')
  })

  it('rejects an end date before the start date', () => {
    expect(
      validateGrantForm({ ...form, ends_at: '2026-05-01' })
    ).toHaveProperty('ends_at')
  })
})

describe('toCreateGrantInput', () => {
  const form = {
    principal_type: 'user',
    principal_id: '  ak-subject-1  ',
    capability: 'enter',
    scope_type: 'global',
    scope_id: '99',
    data_type: 'water chemistry',
    starts_at: '2026-06-01',
    ends_at: '',
    reason: '  seasonal fieldwork  ',
  }

  it('drops the scope id on a global grant and trims free text', () => {
    expect(toCreateGrantInput(form)).toEqual({
      principal_type: 'user',
      principal_id: 'ak-subject-1',
      capability: 'enter',
      scope_type: 'global',
      scope_id: null,
      data_type: 'water chemistry',
      starts_at: '2026-06-01',
      ends_at: null,
      reason: 'seasonal fieldwork',
    })
  })

  it('sends the scope id as a number when the scope needs one', () => {
    expect(toCreateGrantInput({ ...form, scope_type: 'thing' }).scope_id).toBe(
      99
    )
  })

  it('sends null rather than an empty reason', () => {
    expect(toCreateGrantInput({ ...form, reason: '   ' }).reason).toBeNull()
  })
})

describe('zPermissionGrant', () => {
  it('accepts a lexicon term the console does not know about', () => {
    expect(
      grant({ data_type: 'soil gas', capability: 'audit' }).data_type
    ).toBe('soil gas')
  })
})

describe('toDateInputValue', () => {
  it('formats a date for a date input', () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('grantQueryParams', () => {
  it('sends only include_revoked when nothing is filtered', () => {
    expect(grantQueryParams({})).toEqual({ include_revoked: false })
  })

  it('maps each filter to its query name', () => {
    expect(
      grantQueryParams({
        principalId: 'ak-subject-1',
        capability: 'read',
        dataType: 'water level',
        scopeType: 'thing',
        includeRevoked: true,
      })
    ).toEqual({
      principal_id: 'ak-subject-1',
      capability: 'read',
      data_type: 'water level',
      scope_type: 'thing',
      include_revoked: true,
    })
  })

  it('omits an empty filter rather than sending an empty string', () => {
    expect(grantQueryParams({ principalId: '   ', capability: '' })).toEqual({
      include_revoked: false,
    })
  })

  it('trims the principal it does send', () => {
    expect(grantQueryParams({ principalId: '  ak-1  ' }).principal_id).toBe(
      'ak-1'
    )
  })
})

describe('isUnfiltered', () => {
  it('treats include-revoked alone as still unfiltered', () => {
    expect(isUnfiltered({ includeRevoked: true })).toBe(true)
  })

  it('is false once any narrowing filter is set', () => {
    expect(isUnfiltered({ capability: 'read' })).toBe(false)
    expect(isUnfiltered({ principalId: 'ak-1' })).toBe(false)
  })

  it('ignores a whitespace-only principal', () => {
    expect(isUnfiltered({ principalId: '  ' })).toBe(true)
  })
})

describe('sortGrants across principals', () => {
  it('groups equal-dated rows by principal', () => {
    const rows = sortGrants(
      [
        grant({ id: 1, principal_id: 'zeta' }),
        grant({ id: 2, principal_id: 'alpha' }),
      ],
      today
    )

    expect(rows.map((row) => row.principal_id)).toEqual(['alpha', 'zeta'])
  })
})
