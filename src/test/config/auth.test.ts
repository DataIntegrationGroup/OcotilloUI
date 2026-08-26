import { describe, expect, it } from 'vitest'
import { buildAuthentikUrl } from '@/config/auth'

describe('buildAuthentikUrl', () => {
  it('does not duplicate slashes when the base URL ends with a slash', () => {
    expect(
      buildAuthentikUrl('authorize/', 'http://localhost:8000/').toString()
    ).toBe('http://localhost:8000/authorize/')
  })

  it('does not duplicate slashes when the path starts with a slash', () => {
    expect(
      buildAuthentikUrl('/authorize/', 'http://localhost:8000').toString()
    ).toBe('http://localhost:8000/authorize/')
  })
})
