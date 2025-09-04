import { expect, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { checkMockServerHealth } from './mock-server'

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
    const isHealthy = await checkMockServerHealth()
    if (!isHealthy) {
      console.warn('Mock server health check failed. Some integration tests may fail.')
    }
  })

// Cleanup after each test case
afterEach(() => {
  cleanup()
})
