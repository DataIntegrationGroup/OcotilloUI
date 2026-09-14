// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { EnvironmentBadge } from '@/components/layout/environment-badge'

describe('EnvironmentBadge', () => {
  const badge = (container: HTMLElement) => container.querySelector('[data-slot="badge"]')

  it('renders without crashing on staging', () => {
    vi.stubEnv('VITE_APP_ENV', 'staging')
    const { container } = render(<EnvironmentBadge />)
    expect(container).toBeTruthy()
  })

  it('shows STAGING with a data-slot="badge" attribute on staging', () => {
    vi.stubEnv('VITE_APP_ENV', 'staging')
    const { container } = render(<EnvironmentBadge />)
    const el = badge(container)
    console.log('Badge found:', !!el, '| text:', el?.textContent)
    expect(el).toBeTruthy()
    expect(el?.textContent).toBe('STAGING')
  })

  it('renders nothing on production (BDMS-587 AC #2)', () => {
    vi.stubEnv('VITE_APP_ENV', 'production')
    const { container } = render(<EnvironmentBadge />)
    expect(badge(container)).toBeNull()
  })
})
