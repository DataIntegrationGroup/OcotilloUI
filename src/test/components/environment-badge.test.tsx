// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { EnvironmentBanner } from '@/components/layout/environment-banner'

describe('EnvironmentBanner', () => {
  const status = (container: HTMLElement) => container.querySelector('[role="status"]')

  it('renders on staging', () => {
    vi.stubEnv('VITE_APP_ENV', 'staging')
    const { container } = render(<EnvironmentBanner />)
    expect(status(container)).toBeTruthy()
  })

  it('shows STAGING on staging', () => {
    vi.stubEnv('VITE_APP_ENV', 'staging')
    const { container } = render(<EnvironmentBanner />)
    expect(status(container)?.textContent).toContain('STAGING')
  })

  it('renders nothing on production (BDMS-587 AC #2)', () => {
    vi.stubEnv('VITE_APP_ENV', 'production')
    const { container } = render(<EnvironmentBanner />)
    expect(status(container)).toBeNull()
  })
})
