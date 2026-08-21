// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IWell } from '@/interfaces/ocotillo'

const mockedGo = vi.fn()
const mockedNotify = vi.fn()
const mockedDownloadChemistryReport = vi.fn()
const mockedFetchYearObservations = vi.fn()
const mockedUseAccessCapabilities = vi.fn()
const mockedUseWellChemistryReport = vi.fn()
const mockedToBlob = vi.fn()

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useGo: () => mockedGo,
    useNotification: () => ({ open: mockedNotify }),
  }
})

vi.mock('react-router', () => ({ useParams: () => ({ id: '7834' }) }))

vi.mock('@react-pdf/renderer', () => ({
  pdf: () => ({ toBlob: mockedToBlob }),
}))

vi.mock('@/components', () => ({ WellPDF: () => null }))

vi.mock('@/components/pdf/chemistry', () => ({
  downloadChemistryReport: (args: unknown) =>
    mockedDownloadChemistryReport(args),
}))

vi.mock('@/hooks', () => ({
  useAccessCapabilities: () => mockedUseAccessCapabilities(),
  useWellChemistryReport: (args: unknown) => mockedUseWellChemistryReport(args),
}))

// The report-type select stands in for the Radix one: this exercises the
// button group's wiring, not the primitive's open/close behavior.
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
  }) => (
    <select
      aria-label="Report type"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) => <option value={value}>{children}</option>,
}))

import { WellPDFActionsButton } from '@/components/Button/WellPDFActions'
import { TooltipProvider } from '@/components/ui/tooltip'

const well = { id: 7834, name: 'SA-0231' } as IWell

const renderGroup = () =>
  render(
    <TooltipProvider>
      <WellPDFActionsButton
        isPreviewLoading={false}
        isDownloadLoading={false}
        well={well}
        observations={[]}
        assets={[]}
        contacts={[]}
      />
    </TooltipProvider>
  )

const reportTypeSelect = () => screen.getByLabelText('Report type')
const previewButton = () => screen.getByRole('button', { name: /preview pdf/i })
const downloadButton = () => screen.getByRole('button', { name: /^download/i })

const selectChemistryReport = () =>
  fireEvent.change(reportTypeSelect(), {
    target: { value: 'chemistry-report' },
  })

describe('WellPDFActionsButton report type select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:pdf')
    URL.revokeObjectURL = vi.fn()
    mockedToBlob.mockResolvedValue(new Blob())
    mockedDownloadChemistryReport.mockResolvedValue(
      'chemistry-report-SA-0231-2024.pdf'
    )
    mockedFetchYearObservations.mockResolvedValue([{ id: 1 }])
    mockedUseAccessCapabilities.mockReturnValue({
      isLoading: false,
      canManageAmp: true,
      canViewConfidential: true,
      canViewAmpStaging: true,
    })
    mockedUseWellChemistryReport.mockReturnValue({
      reportYear: 2024,
      hasChemistry: true,
      isLoading: false,
      fetchYearObservations: mockedFetchYearObservations,
    })
  })

  it('offers a field sheet and a chemistry report, defaulting to the field sheet', () => {
    renderGroup()

    const options = within(reportTypeSelect()).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'Field sheet',
      'Chemistry report',
    ])
    expect(reportTypeSelect()).toHaveValue('field-sheet')
  })

  it('withholds the chemistry report from users outside the staging group', () => {
    mockedUseAccessCapabilities.mockReturnValue({
      isLoading: false,
      canManageAmp: true,
      canViewConfidential: true,
      canViewAmpStaging: false,
    })

    renderGroup()

    const options = within(reportTypeSelect()).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Field sheet'])
  })

  it('generates the field sheet while it is the selected type', async () => {
    renderGroup()

    await act(async () => {
      fireEvent.click(downloadButton())
    })

    expect(mockedToBlob).toHaveBeenCalledTimes(1)
    expect(mockedDownloadChemistryReport).not.toHaveBeenCalled()
  })

  it('generates the chemistry report once it is selected', async () => {
    renderGroup()
    selectChemistryReport()

    await act(async () => {
      fireEvent.click(downloadButton())
    })

    await waitFor(() =>
      expect(mockedDownloadChemistryReport).toHaveBeenCalledTimes(1)
    )
    expect(mockedFetchYearObservations).toHaveBeenCalledWith(2024)
    expect(mockedDownloadChemistryReport.mock.calls[0][0]).toMatchObject({
      well,
      year: 2024,
      observations: [{ id: 1 }],
    })
    expect(mockedToBlob).not.toHaveBeenCalled()
  })

  it('previews whichever report is selected', () => {
    renderGroup()

    fireEvent.click(previewButton())
    expect(mockedGo).toHaveBeenCalledWith({
      to: '/ocotillo/well/pdf-preview/7834',
      type: 'push',
    })

    selectChemistryReport()
    fireEvent.click(previewButton())
    expect(mockedGo).toHaveBeenLastCalledWith({
      to: '/ocotillo/chemistry-report',
      query: { thing_id: '7834', year: 2024 },
      type: 'push',
    })
  })

  it('offers neither action for a well with no chemistry on file', () => {
    mockedUseWellChemistryReport.mockReturnValue({
      reportYear: null,
      hasChemistry: false,
      isLoading: false,
      fetchYearObservations: mockedFetchYearObservations,
    })

    renderGroup()
    selectChemistryReport()

    expect(previewButton()).toBeDisabled()
    expect(downloadButton()).toBeDisabled()
    expect(previewButton()).toHaveAttribute(
      'title',
      'No water chemistry on file for this well'
    )
  })

  it('leaves the field sheet usable for a well with no chemistry', () => {
    mockedUseWellChemistryReport.mockReturnValue({
      reportYear: null,
      hasChemistry: false,
      isLoading: false,
      fetchYearObservations: mockedFetchYearObservations,
    })

    renderGroup()

    expect(previewButton()).toBeEnabled()
    expect(downloadButton()).toBeEnabled()
  })
})
