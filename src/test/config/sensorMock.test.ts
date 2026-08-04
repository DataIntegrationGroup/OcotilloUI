import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `settings.sensor_mock` decides whether the sensor dashboard shows generated
 * fixtures or real OcotilloAPI data. Getting it wrong in the wrong direction
 * means convincing fake sensor readings on a production dashboard, so the
 * resolution rule is pinned here.
 *
 * The setting is resolved at module load, so each case stubs the env and
 * re-imports.
 */

const loadSensorMock = async () => {
  vi.resetModules()
  const { settings } = await import('@/settings')
  return settings.sensor_mock
}

describe('settings.sensor_mock', () => {
  beforeEach(() => {
    // The suite runs under vitest, which would otherwise force mocking on and
    // mask every case below.
    vi.stubEnv('VITEST', '')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('VITE_SENSOR_MOCK', '')
    vi.stubEnv('VITE_APP_ENV', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('is on for preview deploys, which have no sensor backend', async () => {
    vi.stubEnv('VITE_APP_ENV', 'preview')
    expect(await loadSensorMock()).toBe(true)
  })

  it('is off for staging', async () => {
    vi.stubEnv('VITE_APP_ENV', 'staging')
    expect(await loadSensorMock()).toBe(false)
  })

  it('is off for production', async () => {
    vi.stubEnv('VITE_APP_ENV', 'production')
    expect(await loadSensorMock()).toBe(false)
  })

  it('is off when VITE_APP_ENV is missing', async () => {
    // Fail towards real data: a build that forgets the flag should surface an
    // honest error, not fabricated readings.
    expect(await loadSensorMock()).toBe(false)
  })

  it('is on under test so suites do not need a backend', async () => {
    vi.stubEnv('VITEST', 'true')
    expect(await loadSensorMock()).toBe(true)
  })

  it('lets VITE_SENSOR_MOCK force it on outside preview', async () => {
    vi.stubEnv('VITE_APP_ENV', 'staging')
    vi.stubEnv('VITE_SENSOR_MOCK', 'true')
    expect(await loadSensorMock()).toBe(true)
  })

  it('lets VITE_SENSOR_MOCK force it off inside preview', async () => {
    vi.stubEnv('VITE_APP_ENV', 'preview')
    vi.stubEnv('VITE_SENSOR_MOCK', 'false')
    expect(await loadSensorMock()).toBe(false)
  })

  it('ignores a blank override rather than reading it as false', async () => {
    // Docker sets unpassed ARGs to an empty string, which must not be
    // mistaken for an explicit opt-out.
    vi.stubEnv('VITE_APP_ENV', 'preview')
    vi.stubEnv('VITE_SENSOR_MOCK', '')
    expect(await loadSensorMock()).toBe(true)
  })
})
