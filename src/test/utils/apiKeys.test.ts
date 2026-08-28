// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  type ApiKey,
  API_KEY_EXPIRY_WARNING_DAYS,
  apiKeyStatus,
  createApiKey,
  describeExpiry,
  describeLastUsed,
  generateApiKeyToken,
  isApiKeyActive,
  previewOfToken,
  renameApiKey,
  revokeApiKey,
  sortApiKeys,
} from '@/utils/apiKeys'

const now = new Date('2026-08-23T12:00:00Z')

describe('generateApiKeyToken', () => {
  it('produces a prefixed token of a fixed shape', () => {
    const token = generateApiKeyToken()

    expect(token).toMatch(/^ocot_[a-z0-9]{32}$/)
  })

  it('does not repeat itself', () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateApiKeyToken())
    )

    expect(tokens.size).toBe(50)
  })
})

describe('previewOfToken', () => {
  it('keeps the prefix and the last four characters', () => {
    expect(previewOfToken('ocot_abcdefghijklmnop')).toBe('ocot_abcde…mnop')
  })
})

describe('createApiKey', () => {
  it('records the name, preview and creation time', () => {
    const key = createApiKey({
      name: '  Field laptop  ',
      now,
      token: 'ocot_abcdefghijklmnop',
    })

    expect(key.name).toBe('Field laptop')
    expect(key.token).toBe('ocot_abcdefghijklmnop')
    expect(key.token_preview).toBe('ocot_abcde…mnop')
    expect(key.created_at).toBe('2026-08-23T12:00:00.000Z')
    // 90 days after creation, which is the lifetime the API will issue.
    expect(key.expires_at).toBe('2026-11-21T12:00:00.000Z')
    expect(key.last_used_at).toBeNull()
    expect(isApiKeyActive(key, now)).toBe(true)
  })

  it('names an unnamed key rather than leaving it blank', () => {
    expect(createApiKey({ name: '   ', now }).name).toBe('Untitled key')
  })
})

describe('revokeApiKey', () => {
  it('marks the key revoked and drops the token', () => {
    const key = createApiKey({ name: 'Laptop', now })
    const revoked = revokeApiKey(key, new Date('2026-08-24T09:00:00Z'))

    expect(isApiKeyActive(revoked, now)).toBe(false)
    expect(revoked.revoked_at).toBe('2026-08-24T09:00:00.000Z')
    expect(revoked.token).toBeUndefined()
    expect(revoked.token_preview).toBe(key.token_preview)
  })
})

describe('renameApiKey', () => {
  it('trims the new name and keeps the old one when blank', () => {
    const key = createApiKey({ name: 'Laptop', now })

    expect(renameApiKey(key, '  Desktop  ').name).toBe('Desktop')
    expect(renameApiKey(key, '   ').name).toBe('Laptop')
  })
})

describe('sortApiKeys', () => {
  it('puts active keys first, newest first within each group', () => {
    const older = createApiKey({
      name: 'Older',
      now: new Date('2026-08-01T00:00:00Z'),
    })
    const newer = createApiKey({
      name: 'Newer',
      now: new Date('2026-08-20T00:00:00Z'),
    })
    const revoked = revokeApiKey(
      createApiKey({ name: 'Revoked', now: new Date('2026-08-22T00:00:00Z') }),
      now
    )

    expect(
      sortApiKeys([older, revoked, newer], now).map((key) => key.name)
    ).toEqual(['Newer', 'Older', 'Revoked'])
  })
})

describe('describeLastUsed', () => {
  it('reports never used, revoked, or the date', () => {
    const key = createApiKey({ name: 'Laptop', now })

    expect(describeLastUsed(key)).toBe('Never used')
    expect(describeLastUsed(revokeApiKey(key, now))).toBe('Revoked')

    const used: ApiKey = { ...key, last_used_at: '2026-08-22T18:00:00Z' }
    expect(describeLastUsed(used)).toBe(
      new Date('2026-08-22T18:00:00Z').toLocaleDateString()
    )
  })
})

const daysFromNow = (days: number): Date =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

describe('apiKeyStatus', () => {
  const key = createApiKey({ name: 'Laptop', now })

  it('is active while expiry is further out than the warning window', () => {
    expect(apiKeyStatus(key, daysFromNow(1))).toBe('active')
    expect(
      apiKeyStatus(key, daysFromNow(90 - API_KEY_EXPIRY_WARNING_DAYS - 1))
    ).toBe('active')
  })

  it('warns once expiry is inside the warning window', () => {
    expect(
      apiKeyStatus(key, daysFromNow(90 - API_KEY_EXPIRY_WARNING_DAYS))
    ).toBe('expiring')
    expect(apiKeyStatus(key, daysFromNow(89.5))).toBe('expiring')
  })

  it('is expired at the expiry instant and after it', () => {
    expect(apiKeyStatus(key, daysFromNow(90))).toBe('expired')
    expect(apiKeyStatus(key, daysFromNow(120))).toBe('expired')
    expect(isApiKeyActive(key, daysFromNow(120))).toBe(false)
  })

  it('reports revocation ahead of expiry', () => {
    const revoked = revokeApiKey(key, daysFromNow(1))

    expect(apiKeyStatus(revoked, daysFromNow(120))).toBe('revoked')
  })
})

describe('describeExpiry', () => {
  const key = createApiKey({ name: 'Laptop', now })

  it('counts down in whole days inside the warning window', () => {
    expect(describeExpiry(key, daysFromNow(87))).toBe('Expires in 3 days')
    expect(describeExpiry(key, daysFromNow(89))).toBe('Expires in 1 day')
    // Part of a day left still reads as a day rather than rounding to zero.
    expect(describeExpiry(key, daysFromNow(89.5))).toBe('Expires in 1 day')
  })

  it('says expired once the moment has passed', () => {
    expect(describeExpiry(key, daysFromNow(90))).toBe('Expired')
  })

  it('shows a plain date while expiry is far off', () => {
    expect(describeExpiry(key, daysFromNow(1))).toBe(
      new Date(key.expires_at).toLocaleDateString()
    )
  })
})

describe('sortApiKeys', () => {
  it('drops expired keys below active ones', () => {
    const shortLived = createApiKey({
      name: 'Short',
      now,
      lifetimeDays: 1,
      token: 'ocot_aaaaaaaaaaaaaaaa',
    })
    const longLived = createApiKey({
      name: 'Long',
      now: new Date('2026-08-01T00:00:00Z'),
      token: 'ocot_bbbbbbbbbbbbbbbb',
    })

    expect(
      sortApiKeys([shortLived, longLived], daysFromNow(5)).map((k) => k.name)
    ).toEqual(['Long', 'Short'])
  })
})
