// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportDialog } from '@/pages/ocotillo/thing/components/ExportDialog'

// BDMS-1508 AC3: the batch export dialog offers an owner leave-behind page
// per well, off by default so existing batches stay one page per well.
const renderDialog = (props: Partial<Parameters<typeof ExportDialog>[0]> = {}) => {
  const setIncludeOwnerPage = vi.fn()
  render(
    <ExportDialog
      open
      onClose={vi.fn()}
      onGenerate={vi.fn().mockResolvedValue(undefined)}
      isGenerating={false}
      progress={0}
      rows={[{ id: 1, name: 'WL-0217' }]}
      resolvedCount={1}
      filename="batch.pdf"
      setFilename={vi.fn()}
      includeOwnerPage={false}
      setIncludeOwnerPage={setIncludeOwnerPage}
      {...props}
    />
  )
  return { setIncludeOwnerPage }
}

describe('ExportDialog owner page toggle', () => {
  it('renders unchecked by default and reports the change', async () => {
    const { setIncludeOwnerPage } = renderDialog()
    const checkbox = screen.getByRole('checkbox', {
      name: /include owner leave-behind page/i,
    })
    expect(checkbox).not.toBeChecked()
    expect(
      screen.getByText(/adds a second, owner-facing page after each field sheet/i)
    ).toBeInTheDocument()

    await userEvent.click(checkbox)
    expect(setIncludeOwnerPage).toHaveBeenCalledWith(true)
  })

  it('reflects the on state and locks while generating', () => {
    renderDialog({ includeOwnerPage: true, isGenerating: true })
    const checkbox = screen.getByRole('checkbox', {
      name: /include owner leave-behind page/i,
    })
    expect(checkbox).toBeChecked()
    expect(checkbox).toBeDisabled()
  })
})
