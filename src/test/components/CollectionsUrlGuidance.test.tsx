// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { CollectionsUrlGuidance } from '@/components/CollectionsUrlGuidance'
import { settings } from '@/settings'

const baseApiUrl = settings.ocotillo_api_url.replace(/\/+$/, '')

const renderGuidance = (tab: 'published' | 'internal') =>
  render(
    <MemoryRouter>
      <CollectionsUrlGuidance tab={tab} />
    </MemoryRouter>
  )

describe('CollectionsUrlGuidance', () => {
  it('describes only the public catalogue on the published tab', () => {
    renderGuidance('published')

    expect(
      screen.getByRole('link', { name: `${baseApiUrl}/ogcapi` })
    ).toBeTruthy()
    expect(screen.getByText('Public service')).toBeTruthy()
    expect(screen.queryByText('Internal service')).toBeNull()
    expect(
      screen.queryByRole('link', { name: `${baseApiUrl}/ogcapi-internal` })
    ).toBeNull()
  })

  it('describes only the internal catalogue on the internal tab', () => {
    renderGuidance('internal')

    expect(
      screen.getByRole('link', { name: `${baseApiUrl}/ogcapi-internal` })
    ).toBeTruthy()
    expect(screen.getByText('Internal service')).toBeTruthy()
    expect(screen.queryByText('Public service')).toBeNull()
    expect(
      screen.getByText(/membership in the OGC\.Internal group/)
    ).toBeTruthy()
    // A key, not a CSV export, is how a desktop client reaches the mount.
    expect(screen.getByRole('link', { name: 'Settings' })).toBeTruthy()
  })
})
