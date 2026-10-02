// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PublishStatusNotice } from '@/pages/ocotillo/hydrograph-correction/PublishStatusNotice'

const renderNotice = (
  props: Partial<Parameters<typeof PublishStatusNotice>[0]> = {}
) => {
  const onDismissSuccess = vi.fn()
  const onDismissError = vi.fn()
  render(
    <PublishStatusNotice
      progress={null}
      success={null}
      error={null}
      onDismissSuccess={onDismissSuccess}
      onDismissError={onDismissError}
      {...props}
    />
  )
  return { onDismissSuccess, onDismissError }
}

describe('PublishStatusNotice', () => {
  it('shows nothing when no publish is running or reported', () => {
    renderNotice()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('names the well and shows ongoing progress while publishing', () => {
    renderNotice({ progress: { wellName: 'WL-0001' } })

    const status = screen.getByRole('status')
    expect(status.textContent).toContain('Publishing to WL-0001')
    expect(status.textContent).toContain('several minutes')
    expect(
      screen.getByRole('progressbar', { name: 'Publishing to WL-0001' })
    ).toBeTruthy()
  })

  it('says which step is running when there is more than one', () => {
    renderNotice({
      progress: { wellName: 'WL-0001', detail: 'Writing block 2 of 3.' },
    })
    expect(screen.getByRole('status').textContent).toContain(
      'Writing block 2 of 3.'
    )
  })

  it('keeps the outcome up, naming the well, until it is dismissed', async () => {
    const user = userEvent.setup()
    const { onDismissSuccess, onDismissError } = renderNotice({
      success: { wellName: 'WL-0001', message: 'Published 10 observations.' },
      error: { wellName: 'WL-0002', message: 'Server error.' },
    })

    expect(screen.getByText('Publish to WL-0001 complete')).toBeTruthy()
    expect(screen.getByText('Publish to WL-0002 failed')).toBeTruthy()

    const [dismissSuccess, dismissError] = screen.getAllByRole('button', {
      name: 'Close',
    })
    await user.click(dismissSuccess)
    await user.click(dismissError)
    expect(onDismissSuccess).toHaveBeenCalledTimes(1)
    expect(onDismissError).toHaveBeenCalledTimes(1)
  })
})
