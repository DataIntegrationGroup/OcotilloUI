import { describe, expect, it } from 'vitest'
import {
  describeScope,
  describeSubject,
  grantQueryParams,
  grantStatusOf,
  isUiSurfaceGrant,
  isUnfiltered,
  matchesFilters,
  type PermissionGrant,
  scopeIdRequired,
  sortGrants,
  toCreateGrantInput,
  validateGrantForm,
  zPermissionGrant,
} from '@/utils/accessGrants'
import { isRevocable, toDateInputValue } from '@/utils/accessLifecycle'

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

describe('matchesFilters', () => {
  const row = grant({
    principal_id: 'ak-subject-1',
    capability: 'read',
    data_type: 'water level',
    scope_type: 'global',
  })

  it('matches everything when nothing is filtered', () => {
    expect(matchesFilters(row, {})).toBe(true)
  })

  it('matches on each filter the console offers', () => {
    expect(matchesFilters(row, { principalId: '  ak-subject-1  ' })).toBe(true)
    expect(matchesFilters(row, { principalId: 'ak-subject-2' })).toBe(false)
    expect(matchesFilters(row, { capability: 'read' })).toBe(true)
    expect(matchesFilters(row, { capability: 'enter' })).toBe(false)
    expect(matchesFilters(row, { dataType: 'water level' })).toBe(true)
    expect(matchesFilters(row, { dataType: 'site metadata' })).toBe(false)
    expect(matchesFilters(row, { scopeType: 'global' })).toBe(true)
    expect(matchesFilters(row, { scopeType: 'thing' })).toBe(false)
  })

  it('excludes a surface grant from a data type filter', () => {
    const surface = grant({ data_type: null, ui_surface: 'ocotillo.lexicon' })

    expect(matchesFilters(surface, { dataType: 'water level' })).toBe(false)
    expect(matchesFilters(surface, {})).toBe(true)
  })
})

describe('validateGrantForm', () => {
  const form = {
    principal_id: 'ak-subject-1',
    subject: 'data_type',
    ui_surface: '',
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

  it('requires a screen on a UI surface grant', () => {
    expect(
      validateGrantForm({ ...form, subject: 'ui_surface' })
    ).toHaveProperty('ui_surface')
    expect(
      validateGrantForm({
        ...form,
        subject: 'ui_surface',
        ui_surface: 'ocotillo.lexicon',
      })
    ).toEqual({})
  })

  it('asks for no scope id on a surface grant, whatever the scope select holds', () => {
    expect(
      validateGrantForm({
        ...form,
        subject: 'ui_surface',
        ui_surface: 'ocotillo.lexicon',
        scope_type: 'thing',
      })
    ).toEqual({})
  })
})

describe('toCreateGrantInput', () => {
  const form = {
    principal_type: 'user',
    principal_id: '  ak-subject-1  ',
    capability: 'enter',
    scope_type: 'global',
    scope_id: '99',
    subject: 'data_type',
    data_type: 'water chemistry',
    ui_surface: '',
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
      ui_surface: null,
      starts_at: '2026-06-01',
      ends_at: null,
      reason: 'seasonal fieldwork',
    })
  })

  it('sends a surface grant as global, with no data type', () => {
    expect(
      toCreateGrantInput({
        ...form,
        subject: 'ui_surface',
        ui_surface: 'ocotillo.lexicon',
        scope_type: 'thing',
      })
    ).toMatchObject({
      scope_type: 'global',
      scope_id: null,
      data_type: null,
      ui_surface: 'ocotillo.lexicon',
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

  it('parses a surface grant, which carries no data type', () => {
    const surfaceGrant = grant({
      data_type: null,
      ui_surface: 'ocotillo.lexicon',
    })

    expect(isUiSurfaceGrant(surfaceGrant)).toBe(true)
    expect(describeSubject(surfaceGrant)).toBe('ocotillo.lexicon')
  })

  it('describes a data grant by its data type', () => {
    expect(describeSubject(grant({ data_type: 'water level' }))).toBe(
      'water level'
    )
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
