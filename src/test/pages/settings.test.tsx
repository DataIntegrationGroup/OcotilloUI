// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  AccessCard,
  AppearanceCard,
  NavigationCard,
  ProfileCard,
} from '@/pages/settings'

describe('ProfileCard', () => {
  it('shows the identity from single sign-on', () => {
    render(
      <ProfileCard
        name="Jake Ross"
        email="jake@example.org"
        userId="abc-123"
        expiry="Expires in 42 minutes"
      />
    )

    expect(screen.getByText('Jake Ross')).toBeInTheDocument()
    expect(screen.getByText('jake@example.org')).toBeInTheDocument()
    expect(screen.getByText('abc-123')).toBeInTheDocument()
    expect(screen.getByText('Expires in 42 minutes')).toBeInTheDocument()
    expect(screen.getByText('JR')).toBeInTheDocument()
  })

  it('falls back when the token carries no name or email', () => {
    render(<ProfileCard expiry={null} />)

    expect(screen.getByText('Unknown user')).toBeInTheDocument()
    expect(screen.getByText('No email on this account')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('omits the session row when the expiry is unknown', () => {
    render(<ProfileCard name="Jake Ross" expiry={null} />)

    expect(screen.queryByText('Session')).not.toBeInTheDocument()
  })
})

describe('AccessCard', () => {
  it('groups roles by portal and marks the primary one', () => {
    render(
      <AccessCard
        roles={['AMP.Viewer', 'AMP.Editor', 'Geothermal.Admin']}
        primaryRole="Geothermal.Admin"
      />
    )

    expect(screen.getByText('Aquifer Mapping Program')).toBeInTheDocument()
    expect(screen.getByText('Geothermal')).toBeInTheDocument()
    expect(screen.getByText('Viewer')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('says so when the account has no roles', () => {
    render(<AccessCard roles={[]} primaryRole={null} />)

    expect(
      screen.getByText(/No portal roles are assigned to this account/)
    ).toBeInTheDocument()
  })
})

describe('AppearanceCard', () => {
  it('marks the current preference as selected', () => {
    render(<AppearanceCard preference="system" onChange={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'System theme' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('reports the chosen preference', async () => {
    const onChange = vi.fn()
    render(<AppearanceCard preference="light" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Dark theme' }))

    expect(onChange).toHaveBeenCalledWith('dark')
  })

  it('ignores a click on the already-selected option', async () => {
    const onChange = vi.fn()
    render(<AppearanceCard preference="light" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Light theme' }))

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('NavigationCard', () => {
  it('reflects the stored preference', () => {
    render(
      <NavigationCard
        autoCollapseOnMap={false}
        onAutoCollapseChange={vi.fn()}
      />
    )

    expect(
      screen.getByRole('checkbox', {
        name: 'Collapse the sidebar on the map',
      })
    ).not.toBeChecked()
  })

  it('reports the toggled value', async () => {
    const onAutoCollapseChange = vi.fn()
    render(
      <NavigationCard
        autoCollapseOnMap
        onAutoCollapseChange={onAutoCollapseChange}
      />
    )

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'Collapse the sidebar on the map',
      })
    )

    expect(onAutoCollapseChange).toHaveBeenCalledWith(false)
  })
})
