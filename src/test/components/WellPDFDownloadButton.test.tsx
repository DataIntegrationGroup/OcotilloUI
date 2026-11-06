// @vitest-environment jsdom

import { pdf } from '@react-pdf/renderer'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WellPDFDownloadButton } from '@/components/Button/WellPDFDownload'
import type { ISample, IWell } from '@/interfaces/ocotillo'

// hoisted so the vi.mock factories below can reference them without hitting the
// "cannot access ... before initialization" error from vitest's hoisting.
const { pdfMock, useAccessImpl, notifyOpen } = vi.hoisted(() => ({
  pdfMock: vi.fn(() => ({ toBlob: async () => new Blob() })),
  useAccessImpl: vi.fn(() => ({
    isLoading: false,
    canManageAmp: true,
    canViewConfidential: true,
  })),
  notifyOpen: vi.fn(),
}))

vi.mock('@react-pdf/renderer', () => ({ pdf: pdfMock }))

// The PDF component is replaced with a stub so the test asserts on what the button
// hands it (via the mocked react-pdf renderer), not on real PDF rendering.
vi.mock('@/components', () => ({ FieldCompilationNotesPdf: () => null }))

vi.mock('@/components/ui/button', () => ({
  Button: (props: {
    onClick?: () => void
    disabled?: boolean
    children: React.ReactNode
  }) => (
    <button onClick={props.onClick} disabled={!!props.disabled}>
      {props.children}
    </button>
  ),
}))

vi.mock('@/config', () => ({ PDF_SINGLE_PAGE_OPTION: { density: 'standard' } }))
vi.mock('@/hooks', () => ({ useAccessCapabilities: () => useAccessImpl() }))
// Type-only modules; keep them loadable without side effects.
vi.mock('@/interfaces', () => ({}))
vi.mock('@/interfaces/ocotillo', () => ({}))
vi.mock('@refinedev/core', () => ({
  useNotification: () => ({ open: notifyOpen }),
  BaseRecord: undefined,
}))
vi.mock('@/utils', () => ({
  buildPdfFilename: () => 'well-test.pdf',
  SensorDeploymentRow: null,
}))

const well = { id: 42, name: 'WT-101' } as unknown as IWell
const sample = { id: 7, sample_method: ' ASTM D5386 ' } as unknown as ISample

const downloadButton = () =>
  screen.getByRole('button', { name: /^download pdf/i })

beforeEach(() => {
  useAccessImpl.mockReturnValue({
    isLoading: false,
    canManageAmp: true,
    canViewConfidential: true,
  })
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
})

describe('WellPDFDownloadButton — sampleMethodsBySampleId wiring', () => {
  it('keys the resolved sample method by id in the PDF props (mirrors batch path)', async () => {
    render(
      <WellPDFDownloadButton
        well={well}
        isLoading={false}
        observations={[]}
        assets={[]}
        contacts={[]}
        sample={sample}
      />
    )

    await act(async () => {
      fireEvent.click(downloadButton())
    })

    await waitFor(() => expect(pdfMock).toHaveBeenCalledTimes(1))

    const passedProps = (pdfMock as any).mock.calls[0][0].props
    // Whitespace from the stored method is trimmed; keyed by the sample id.
    expect(passedProps.sampleMethodsBySampleId).toEqual({ 7: 'ASTM D5386' })
  })

  it('passes an empty record when no sample is available', async () => {
    render(
      <WellPDFDownloadButton
        well={well}
        isLoading={false}
        observations={[]}
        assets={[]}
        contacts={[]}
      />
    )

    await act(async () => {
      fireEvent.click(downloadButton())
    })

    await waitFor(() => expect(pdfMock).toHaveBeenCalledTimes(1))

    const passedProps = (pdfMock as any).mock.calls[0][0].props
    expect(passedProps.sampleMethodsBySampleId).toEqual({})
  })
})
