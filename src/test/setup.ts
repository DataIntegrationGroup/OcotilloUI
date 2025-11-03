import { beforeAll, vi } from 'vitest'
import { checkMockServerHealth } from './mock-server'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'

process.env.NODE_ENV = 'test'

// Mock the authentication provider (for node api contract tests)
vi.mock('@/providers/authentik-provider', () => ({
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  getAccessControlGroups: vi.fn().mockReturnValue(['Admin']),
}))

// Global test setup
beforeAll(async () => {
  const env = process.env.TEST_ENV || 'mock'
  const expectedUrl =
    env === 'ci' ? 'http://localhost:8000' : 'http://127.0.0.1:4010'
  const actualUrl = ocotilloDataProvider.getApiUrl()

  //double check node env is test
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'Non-Test environment detected. Tests must be run with NODE_ENV=test'
    )
  }

  if (actualUrl !== expectedUrl) {
    throw new Error(
      `Ocotillo data provider mismatch: expected ${expectedUrl}, got ${actualUrl}`
    )
  } else {
    console.log(`Ocotillo data provider is using ${expectedUrl}`)
  }

  if (env === 'mock') {
    const isHealthy = await checkMockServerHealth()
    if (!isHealthy) {
      console.warn(
        'Mock server health check failed. Some integration tests may fail.'
      )
    }
  } else {
    console.log('Using live FastAPI server — skipping mock health check.')
  }
})
