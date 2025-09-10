import { expect, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { checkMockServerHealth } from './mock-server'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'

process.env.NODE_ENV = 'test'

expect.extend(matchers)

// Mock localStorage for node environment
Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  })
  
  // Mock the authentication provider
  vi.mock('@/providers/authentik-provider', () => ({
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
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

// Cleanup after each test case
afterEach(() => {
  cleanup()
})
