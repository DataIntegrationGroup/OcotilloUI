import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'
import { checkMockServerHealth } from './mock-server'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'

process.env.NODE_ENV = 'test'

// Radix positions its popper layers (tooltip, select, dropdown) by measuring
// the trigger, and jsdom implements no ResizeObserver to measure with. Guarded
// because the API contract tests run in the node environment, where there is
// no window to patch.
if (typeof window !== 'undefined') {
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
  
  // Mock the authentication provider (for node api contract tests)
  vi.mock('@/providers/authentik-provider', () => ({
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
    getAccessControlGroups: vi
      .fn()
      .mockReturnValue(['AMP.Viewer', 'AMP.Editor', 'AMP.Admin']),
  }))

// Global test setup
beforeAll(async () => {

    //double check node env is test
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Non-Test environment detected. Tests must be run with NODE_ENV=test')
    }

    //check ocotillo data provider is using the mock server
    if (ocotilloDataProvider.getApiUrl() !== 'http://127.0.0.1:4010') {
      throw new Error('Ocotillo data provider is not using the mock server. Tests must be run with NODE_ENV=test')
    } else {
      console.log('Ocotillo data provider is using the mock server, running tests...')
    }

    const isHealthy = await checkMockServerHealth()
    if (!isHealthy) {
      console.warn('Mock server health check failed. Some integration tests may fail.')
    }
  })
