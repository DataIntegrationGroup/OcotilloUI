// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  type ApiKey,
  createApiKey,
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
    expect(key.tokenPreview).toBe('ocot_abcde…mnop')
    expect(key.createdAt).toBe('2026-08-23T12:00:00.000Z')
    expect(key.lastUsedAt).toBeNull()
    expect(isApiKeyActive(key)).toBe(true)
  })

  it('names an unnamed key rather than leaving it blank', () => {
    expect(createApiKey({ name: '   ', now }).name).toBe('Untitled key')
  })
})

describe('revokeApiKey', () => {
  it('marks the key revoked and drops the token', () => {
    const key = createApiKey({ name: 'Laptop', now })
    const revoked = revokeApiKey(key, new Date('2026-08-24T09:00:00Z'))

    expect(isApiKeyActive(revoked)).toBe(false)
    expect(revoked.revokedAt).toBe('2026-08-24T09:00:00.000Z')
    expect(revoked.token).toBeUndefined()
    expect(revoked.tokenPreview).toBe(key.tokenPreview)
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

    expect(sortApiKeys([older, revoked, newer]).map((key) => key.name)).toEqual(
      ['Newer', 'Older', 'Revoked']
    )
  })
})

describe('describeLastUsed', () => {
  it('reports never used, revoked, or the date', () => {
    const key = createApiKey({ name: 'Laptop', now })

    expect(describeLastUsed(key)).toBe('Never used')
    expect(describeLastUsed(revokeApiKey(key, now))).toBe('Revoked')

    const used: ApiKey = { ...key, lastUsedAt: '2026-08-22T18:00:00Z' }
    expect(describeLastUsed(used)).toBe(
      new Date('2026-08-22T18:00:00Z').toLocaleDateString()
    )
  })
})
