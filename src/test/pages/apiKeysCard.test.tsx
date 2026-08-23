// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ApiKeysCard } from '@/pages/settings/ApiKeysCard'
import { createApiKey, revokeApiKey } from '@/utils/apiKeys'

const now = new Date('2026-08-23T12:00:00Z')

const laptopKey = createApiKey({
  name: 'Field laptop',
  now,
  token: 'ocot_abcdefghijklmnop',
  id: 'key-1',
})

describe('ApiKeysCard', () => {
  it('says it is not connected to the API', () => {
    render(<ApiKeysCard />)

    expect(screen.getByText(/Preview only/)).toBeInTheDocument()
    expect(screen.getByText(/No keys yet/)).toBeInTheDocument()
  })

  it('lists existing keys by preview, never the full token', () => {
    render(<ApiKeysCard initialKeys={[laptopKey]} now={() => now} />)

    expect(screen.getByText('Field laptop')).toBeInTheDocument()
    expect(screen.getByText('ocot_abcde…mnop')).toBeInTheDocument()
    expect(screen.queryByText('ocot_abcdefghijklmnop')).not.toBeInTheDocument()
    expect(screen.getByText('Never used')).toBeInTheDocument()
  })

  it('generates a key and shows it once for copying', async () => {
    const user = userEvent.setup()
    render(<ApiKeysCard now={() => now} />)

    await user.click(screen.getByRole('button', { name: 'Generate key' }))
    await user.type(screen.getByLabelText('Key name'), 'QGIS at the office')
    await user.click(screen.getByRole('button', { name: 'Generate' }))

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText(/only time the full key/)
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/^ocot_[a-z0-9]{32}$/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Done' }))

    expect(screen.getByText('QGIS at the office')).toBeInTheDocument()
    expect(screen.queryByText(/^ocot_[a-z0-9]{32}$/)).not.toBeInTheDocument()
  })

  it('will not generate a key without a name', async () => {
    const user = userEvent.setup()
    render(<ApiKeysCard now={() => now} />)

    await user.click(screen.getByRole('button', { name: 'Generate key' }))

    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled()
  })

  it('renames a key', async () => {
    const user = userEvent.setup()
    render(<ApiKeysCard initialKeys={[laptopKey]} now={() => now} />)

    await user.click(
      screen.getByRole('button', { name: 'Rename Field laptop' })
    )
    const field = screen.getByLabelText('Key name')
    await user.clear(field)
    await user.type(field, 'Field tablet')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Field tablet')).toBeInTheDocument()
    expect(screen.queryByText('Field laptop')).not.toBeInTheDocument()
  })

  it('revokes a key only after confirmation', async () => {
    const user = userEvent.setup()
    render(<ApiKeysCard initialKeys={[laptopKey]} now={() => now} />)

    await user.click(
      screen.getByRole('button', { name: 'Revoke Field laptop' })
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    // The dialog fades out; the table underneath stays aria-hidden until it has.
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(screen.queryByText('Revoked')).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Revoke Field laptop' })
    )
    await user.click(screen.getByRole('button', { name: 'Revoke key' }))

    expect(screen.getAllByText('Revoked').length).toBeGreaterThan(0)
  })

  it('disables the actions on an already revoked key', () => {
    render(
      <ApiKeysCard
        initialKeys={[revokeApiKey(laptopKey, now)]}
        now={() => now}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Rename Field laptop' })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Revoke Field laptop' })
    ).toBeDisabled()
  })
})
