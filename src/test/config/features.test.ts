import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * SHOW_GIS_DOWNLOADS is resolved once at module load, so each case stubs the
 * env and re-imports.
 */
const loadFlag = async (
  env: Record<string, string | undefined>
): Promise<boolean> => {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue
    vi.stubEnv(key, value)
  }
  const { SHOW_GIS_DOWNLOADS } = await import('@/config/features')
  return SHOW_GIS_DOWNLOADS
}

describe('SHOW_GIS_DOWNLOADS', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_APP_ENV', 'production')
    vi.stubEnv('VITE_ENABLE_GIS_DOWNLOADS', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('is off with no override', async () => {
    await expect(loadFlag({})).resolves.toBe(false)
  })

  it('stays off in local dev', async () => {
    await expect(loadFlag({ DEV: 'true' })).resolves.toBe(false)
  })

  it.each(['preview', 'staging'])(
    'stays off on the %s deploy',
    async (appEnv) => {
      await expect(loadFlag({ VITE_APP_ENV: appEnv })).resolves.toBe(false)
    }
  )

  it.each(['1', 'true', 'yes', 'on', ' TRUE '])(
    'is on for VITE_ENABLE_GIS_DOWNLOADS=%j',
    async (value) => {
      await expect(
        loadFlag({ VITE_ENABLE_GIS_DOWNLOADS: value })
      ).resolves.toBe(true)
    }
  )

  it.each(['0', 'false', 'no', 'off'])(
    'is off for VITE_ENABLE_GIS_DOWNLOADS=%j',
    async (value) => {
      await expect(
        loadFlag({ DEV: 'true', VITE_ENABLE_GIS_DOWNLOADS: value })
      ).resolves.toBe(false)
    }
  )

  it('ignores a value it does not recognise and stays off', async () => {
    await expect(
      loadFlag({ DEV: 'true', VITE_ENABLE_GIS_DOWNLOADS: 'maybe' })
    ).resolves.toBe(false)
  })
})
