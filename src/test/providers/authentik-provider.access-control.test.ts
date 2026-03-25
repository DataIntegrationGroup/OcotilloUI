import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type StorageMock = {
  getItem: ReturnType<typeof vi.fn>
  setItem: ReturnType<typeof vi.fn>
  removeItem: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
  key: ReturnType<typeof vi.fn>
  length: number
}

const createStorageMock = (): StorageMock => {
  const store = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size
    },
  }
}

describe('authentik provider access-control normalization', () => {
  let localStorageMock: StorageMock

  beforeEach(() => {
    vi.resetModules()
    localStorageMock = createStorageMock()
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.doUnmock('@/providers/authentik-provider')
    vi.doUnmock('@/config')
    vi.doUnmock('jwt-decode')
  })

  it('normalizes token groups from the ID token when testing auth is disabled', async () => {
    vi.doMock('@/config', async () => {
      const actual = await vi.importActual<typeof import('@/config')>('@/config')
      return { ...actual, IS_TESTING_AUTH: false }
    })
    vi.doMock('jwt-decode', () => ({
      jwtDecode: vi.fn().mockReturnValue({
        groups: ['Viewer', 'Geothermal.Editor', 'OcotilloAdmin'],
      }),
    }))
    vi.doUnmock('@/providers/authentik-provider')

    const { STORAGE_KEYS } = await import('@/config')
    localStorage.setItem(STORAGE_KEYS.idToken, 'encoded-token')

    const { getAccessControlGroups } = await import(
      '@/providers/authentik-provider'
    )

    expect(getAccessControlGroups()).toEqual([
      'AMP.Viewer',
      'AMP.Editor',
      'AMP.Admin',
      'Geothermal.Viewer',
      'Geothermal.Editor',
    ])
  })

  it('returns null when there is no ID token', async () => {
    vi.doMock('@/config', async () => {
      const actual = await vi.importActual<typeof import('@/config')>('@/config')
      return { ...actual, IS_TESTING_AUTH: false }
    })
    vi.doMock('jwt-decode', () => ({
      jwtDecode: vi.fn(),
    }))
    vi.doUnmock('@/providers/authentik-provider')

    const { getAccessControlGroups } = await import(
      '@/providers/authentik-provider'
    )

    expect(getAccessControlGroups()).toBeNull()
  })
})
