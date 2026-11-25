// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportDialog } from '@/pages/ocotillo/thing/components/ExportDialog'

// BDMS-1508: the Owner Sheet toggle exists on both export surfaces, matching
// the wells PDF preview mockup. A batch starts with it off; each well's field
// sheet is page 1 and the owner page, when on, follows as page 2.
const renderDialog = (props: Partial<Parameters<typeof ExportDialog>[0]> = {}) =>
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
      setIncludeOwnerPage={vi.fn()}
      {...props}
    />
  )

describe('ExportDialog batch export options', () => {
  it('lists the wells being exported', () => {
    renderDialog()
    expect(screen.getByText('WL-0217')).toBeInTheDocument()
    expect(screen.getByText('Export Summary')).toBeInTheDocument()
  })

  it('offers the owner sheet toggle, off by default', () => {
    renderDialog()
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText('Owner Sheet')).toBeInTheDocument()
    expect(screen.getByText(/adds page 2/i)).toBeInTheDocument()
  })

  it('reports a toggle to the parent', async () => {
    const setIncludeOwnerPage = vi.fn()
    renderDialog({ setIncludeOwnerPage })
    await userEvent.click(screen.getByRole('checkbox'))
    expect(setIncludeOwnerPage).toHaveBeenCalledWith(true)
  })
})
