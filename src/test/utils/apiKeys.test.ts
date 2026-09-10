// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  API_KEY_EXPIRY_WARNING_DAYS,
  type ApiKey,
  apiKeyStatus,
  describeExpiry,
  describeLastUsed,
  isApiKeyActive,
  sortApiKeys,
  zApiKey,
  zNewApiKey,
} from '@/utils/apiKeys'

const now = new Date('2026-08-23T12:00:00Z')

const key = (overrides: Partial<ApiKey> = {}): ApiKey =>
  zApiKey.parse({
    id: 1,
    name: 'Field laptop',
    token_preview: 'ocot_abcde…mnop',
    scope: 'ogc_internal',
    created_at: '2026-08-23T12:00:00.000Z',
    // 90 days out, which is what the API issues by default.
    expires_at: '2026-11-21T12:00:00.000Z',
    ...overrides,
  })

const daysFromNow = (days: number): Date =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

describe('zApiKey', () => {
  it('defaults the nullable stamps the API may omit', () => {
    const parsed = key()

    expect(parsed.last_used_at).toBeNull()
    expect(parsed.revoked_at).toBeNull()
  })

  it('carries a field the console does not know about', () => {
    expect(
      zApiKey.parse({
        ...key(),
        owner_name: 'someone@example.org',
      })
    ).toHaveProperty('owner_name')
  })

  it('only the create response carries a token', () => {
    expect(() => zNewApiKey.parse(key())).toThrow()
    expect(zNewApiKey.parse({ ...key(), token: 'ocot_secret' }).token).toBe(
      'ocot_secret'
    )
  })
})

describe('apiKeyStatus', () => {
  it('is active while expiry is further out than the warning window', () => {
    expect(apiKeyStatus(key(), daysFromNow(1))).toBe('active')
    expect(
      apiKeyStatus(key(), daysFromNow(90 - API_KEY_EXPIRY_WARNING_DAYS - 1))
    ).toBe('active')
  })

  it('warns once expiry is inside the warning window', () => {
    expect(
      apiKeyStatus(key(), daysFromNow(90 - API_KEY_EXPIRY_WARNING_DAYS))
    ).toBe('expiring')
    expect(apiKeyStatus(key(), daysFromNow(89.5))).toBe('expiring')
  })

  it('is expired at the expiry instant and after it', () => {
    expect(apiKeyStatus(key(), daysFromNow(90))).toBe('expired')
    expect(isApiKeyActive(key(), daysFromNow(120))).toBe(false)
  })

  it('reports revocation ahead of expiry', () => {
    const revoked = key({ revoked_at: '2026-08-24T09:00:00.000Z' })

    expect(apiKeyStatus(revoked, daysFromNow(120))).toBe('revoked')
  })
})

describe('describeExpiry', () => {
  it('counts down in whole days inside the warning window', () => {
    expect(describeExpiry(key(), daysFromNow(87))).toBe('Expires in 3 days')
    expect(describeExpiry(key(), daysFromNow(89))).toBe('Expires in 1 day')
    // Part of a day left still reads as a day rather than rounding to zero.
    expect(describeExpiry(key(), daysFromNow(89.5))).toBe('Expires in 1 day')
  })

  it('says expired once the moment has passed', () => {
    expect(describeExpiry(key(), daysFromNow(90))).toBe('Expired')
  })

  it('shows a plain date while expiry is far off', () => {
    expect(describeExpiry(key(), daysFromNow(1))).toBe(
      new Date(key().expires_at).toLocaleDateString()
    )
  })
})

describe('sortApiKeys', () => {
  it('puts active keys first, newest first within each group', () => {
    const older = key({ id: 1, name: 'Older', created_at: '2026-08-01' })
    const newer = key({ id: 2, name: 'Newer', created_at: '2026-08-20' })
    const revoked = key({
      id: 3,
      name: 'Revoked',
      created_at: '2026-08-22',
      revoked_at: '2026-08-23',
    })

    expect(
      sortApiKeys([older, revoked, newer], now).map((k) => k.name)
    ).toEqual(['Newer', 'Older', 'Revoked'])
  })

  it('drops expired keys below active ones', () => {
    const shortLived = key({
      id: 1,
      name: 'Short',
      expires_at: '2026-08-24T12:00:00.000Z',
    })
    const longLived = key({ id: 2, name: 'Long', created_at: '2026-08-01' })

    expect(
      sortApiKeys([shortLived, longLived], daysFromNow(5)).map((k) => k.name)
    ).toEqual(['Long', 'Short'])
  })
})

describe('describeLastUsed', () => {
  it('reports never used, revoked, or the date', () => {
    expect(describeLastUsed(key())).toBe('Never used')
    expect(
      describeLastUsed(key({ revoked_at: '2026-08-24T09:00:00.000Z' }))
    ).toBe('Revoked')
    expect(
      describeLastUsed(key({ last_used_at: '2026-08-22T18:00:00Z' }))
    ).toBe(new Date('2026-08-22T18:00:00Z').toLocaleDateString())
  })
})
