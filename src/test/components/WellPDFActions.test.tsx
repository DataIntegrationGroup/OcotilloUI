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
const mockedFetchObservations = vi.fn()
const mockedFetchStandards = vi.fn()
const STANDARDS = new Map([
  ['Arsenic', { kind: 'MCL', limit: 0.01, unit: 'mg/L', source: 'EPA' }],
])
const mockedFetchWaterLevels = vi.fn()
const mockedFetchContinuous = vi.fn()
const mockedUseAccessCapabilities = vi.fn()
const mockedUseWellChemistryReport = vi.fn()
const mockedToBlob = vi.fn()
const mockedPdf = vi.fn()
const mockedGetOne = vi.fn()
const hydrographExport = { mode: 'ready' as 'ready' | 'silent' }

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useGo: () => mockedGo,
    useNotification: () => ({ open: mockedNotify }),
    useDataProvider: () => () => ({ getOne: mockedGetOne }),
  }
})

vi.mock('react-router', () => ({ useParams: () => ({ id: '7834' }) }))

vi.mock('@react-pdf/renderer', () => ({
  pdf: (element: unknown) => {
    mockedPdf(element)
    return { toBlob: mockedToBlob }
  },
}))

vi.mock('@/components', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  return {
    WellPDF: () => null,
    FieldCompilationNotesPdf: () => null,
    // Offscreen chart stand-in: 'ready' hands back a PNG, 'silent' never does.
    HydrographPngExporter: ({ onPngReady }: { onPngReady: (png: string) => void }) => {
      useEffect(() => {
        if (hydrographExport.mode === 'ready') onPngReady('data:image/png;base64,HYD')
      }, [onPngReady])
      return null
    },
  }
})

vi.mock('@/components/pdf/chemistry', () => ({
  downloadChemistryReport: (args: unknown) =>
    mockedDownloadChemistryReport(args),
  // The component reads the default sections to decide whether the logger
  // summary is worth fetching, so the mock has to carry them.
  CHEMISTRY_REPORT_DEFAULT_SECTIONS: {
    waterLevels: false,
    continuousMonitoring: false,
  },
}))

// The field sheet's QRs (page-1 maps, page-2 well) are encoded before pdf(); stub the encoder so the
// download path stays on the same tick as before (no real qrcode/canvas work).
vi.mock('@/components/pdf/chemistry/wellQrCode', () => ({
  buildWeaverQrDataUrl: async () => null,
  // page-1 Google Maps QR (same stub contract as the page-2 one)
  buildWellMapsQrDataUrl: async () => null,
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
    disabled,
    children,
  }: {
    value: string
    disabled?: boolean
    children: React.ReactNode
  }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
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
    mockedFetchObservations.mockResolvedValue([{ id: 'maj-1' }])
    mockedFetchStandards.mockResolvedValue(STANDARDS)
    mockedFetchWaterLevels.mockResolvedValue([
      { key: '1', measuredOn: '2024-05-15T00:00:00Z', depthToWaterFt: 9.4 },
    ])
    mockedFetchContinuous.mockResolvedValue({ recordsInYear: 1107 })
    mockedUseAccessCapabilities.mockReturnValue({
      isLoading: false,
      canManageAmp: true,
      canViewConfidential: true,
      canEditAmp: true,
    })
    mockedUseWellChemistryReport.mockReturnValue({
      reportYear: 2024,
      latestSampledYear: 2024,
      hasChemistry: true,
      isLoading: false,
      fetchObservations: mockedFetchObservations,
      fetchStandards: mockedFetchStandards,
      fetchWaterLevels: mockedFetchWaterLevels,
      fetchContinuous: mockedFetchContinuous,
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

  it('withholds the chemistry report from users who cannot edit', () => {
    mockedUseAccessCapabilities.mockReturnValue({
      isLoading: false,
      canManageAmp: false,
      canViewConfidential: false,
      canEditAmp: false,
    })

    renderGroup()

    const options = within(reportTypeSelect()).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Field sheet'])
    // Nothing was asked of the chemistry endpoint on a well that cannot offer
    // the report.
    expect(mockedUseWellChemistryReport).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    )
  })

  // BDMS-1552: an AMP.Editor was offered the chemistry report but both
  // actions stayed greyed out, since they were gated on AMP.Admin.
  it('lets an editor without admin preview and download either report', () => {
    mockedUseAccessCapabilities.mockReturnValue({
      isLoading: false,
      canManageAmp: false,
      canViewConfidential: true,
      canEditAmp: true,
    })

    renderGroup()

    expect(previewButton()).toBeEnabled()
    expect(downloadButton()).toBeEnabled()

    selectChemistryReport()

    expect(reportTypeSelect()).toHaveValue('chemistry-report')
    expect(previewButton()).toBeEnabled()
    expect(downloadButton()).toBeEnabled()
  })

  it('holds both actions back from a viewer', () => {
    mockedUseAccessCapabilities.mockReturnValue({
      isLoading: false,
      canManageAmp: false,
      canViewConfidential: false,
      canEditAmp: false,
    })

    renderGroup()

    expect(previewButton()).toBeDisabled()
    expect(downloadButton()).toBeDisabled()
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
    // The chemistry is the well's whole record, so the year is not passed to
    // it -- only to the water level fetchers below.
    expect(mockedFetchObservations).toHaveBeenCalledWith()
    expect(mockedDownloadChemistryReport.mock.calls[0][0]).toMatchObject({
      well,
      year: 2024,
      observations: [{ id: 'maj-1' }],
      // Compared against the API's limits, not a table in the client.
      standards: STANDARDS,
    })
    // Neither water level section is fetched: both are off in the report's
    // default sections, which is what the well page generates with, so their
    // requests would buy nothing. The exporter, where either can be switched
    // back on, fetches its own.
    expect(mockedFetchWaterLevels).not.toHaveBeenCalled()
    expect(mockedDownloadChemistryReport.mock.calls[0][0].waterLevels).toEqual(
      []
    )
    expect(mockedFetchContinuous).not.toHaveBeenCalled()
    expect(mockedDownloadChemistryReport.mock.calls[0][0].continuous).toBeNull()
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

  it('greys out the chemistry report on a well with no chemistry', async () => {
    // Nothing on file means nothing to report, so the option says why it is
    // unavailable rather than producing an empty PDF.
    mockedUseWellChemistryReport.mockReturnValue({
      reportYear: 2026,
      latestSampledYear: null,
      hasChemistry: false,
      isLoading: false,
      fetchObservations: mockedFetchObservations,
      fetchStandards: mockedFetchStandards,
      fetchWaterLevels: mockedFetchWaterLevels,
      fetchContinuous: mockedFetchContinuous,
    })
    mockedFetchObservations.mockResolvedValue([])

    renderGroup()

    const [, chemistryOption] = within(reportTypeSelect()).getAllByRole(
      'option'
    )
    expect(chemistryOption).toBeDisabled()
    expect(chemistryOption).toHaveTextContent(
      'Chemistry report — no chemistry data'
    )

    // Selecting it anyway falls back rather than acting on a report that is
    // not on offer.
    selectChemistryReport()
    expect(reportTypeSelect()).toHaveValue('field-sheet')

    await act(async () => {
      fireEvent.click(downloadButton())
    })

    expect(mockedDownloadChemistryReport).not.toHaveBeenCalled()
    expect(mockedToBlob).toHaveBeenCalledTimes(1)
  })

  it('leaves the chemistry report selectable while the lookup is in flight', () => {
    // Greying out on a pending lookup would flicker; the actions already wait.
    mockedUseWellChemistryReport.mockReturnValue({
      reportYear: 2026,
      latestSampledYear: null,
      hasChemistry: false,
      isLoading: true,
      fetchObservations: mockedFetchObservations,
      fetchStandards: mockedFetchStandards,
      fetchWaterLevels: mockedFetchWaterLevels,
      fetchContinuous: mockedFetchContinuous,
    })

    renderGroup()

    const [, chemistryOption] = within(reportTypeSelect()).getAllByRole(
      'option'
    )
    expect(chemistryOption).toBeEnabled()
    expect(chemistryOption).toHaveTextContent('Chemistry report')
  })

  it('holds the actions back only while the reporting year is unknown', () => {
    mockedUseWellChemistryReport.mockReturnValue({
      reportYear: 2026,
      latestSampledYear: null,
      hasChemistry: false,
      isLoading: true,
      fetchObservations: mockedFetchObservations,
      fetchStandards: mockedFetchStandards,
      fetchWaterLevels: mockedFetchWaterLevels,
      fetchContinuous: mockedFetchContinuous,
    })

    renderGroup()

    // The field sheet does not wait on chemistry.
    expect(previewButton()).toBeEnabled()
    expect(downloadButton()).toBeEnabled()

    selectChemistryReport()

    expect(previewButton()).toBeDisabled()
    expect(downloadButton()).toBeDisabled()
  })

  describe('field-sheet download carries real data', () => {
    const readings = [
      { observation_datetime: '2026-10-21T17:00:00Z', value: 41.62, depth_to_water_bgs: 39.52, measuring_point_height: 2.1, sample_id: 102 },
      { observation_datetime: '2026-04-14T17:00:00Z', value: 41.28, depth_to_water_bgs: 39.18, measuring_point_height: 2.1, sample_id: 101 },
    ]
    const samples: Record<number, object> = {
      101: { sample_method: 'Steel tape', contact: { name: 'Jordan Tate' } },
      102: { sample_method: 'Electric tape', contact: { name: 'Ethan Mamer' } },
    }

    const renderWithReadings = () =>
      render(
        <TooltipProvider>
          <WellPDFActionsButton
            isPreviewLoading={false}
            isDownloadLoading={false}
            well={well}
            observations={readings as any}
            assets={[]}
            contacts={[]}
          />
        </TooltipProvider>
      )

    const lastPdfProps = () => (mockedPdf.mock.calls.at(-1)?.[0] as { props: any }).props

    beforeEach(() => {
      hydrographExport.mode = 'ready'
      mockedPdf.mockClear()
      mockedGetOne.mockReset()
      mockedGetOne.mockImplementation(async ({ id }: { id: number }) => ({ data: samples[id] }))
    })

    it('passes non-empty sample maps and the exported hydrograph to the sheet', async () => {
      renderWithReadings()
      await act(async () => {
        fireEvent.click(downloadButton())
      })
      await waitFor(() => expect(mockedToBlob).toHaveBeenCalled())

      expect(mockedGetOne).toHaveBeenCalledWith({ resource: 'ocotillo.sample', id: 102 })
      const props = lastPdfProps()
      expect(props.sampleMethodsBySampleId).toEqual({ 101: 'Steel tape', 102: 'Electric tape' })
      expect(props.staffBySampleId).toEqual({ 101: 'Jordan Tate', 102: 'Ethan Mamer' })
      expect(props.hydrographImage).toBe('data:image/png;base64,HYD')
    })

    it('still downloads, without a hydrograph, when the chart never exports (4 s cap)', async () => {
      hydrographExport.mode = 'silent'
      vi.useFakeTimers()
      try {
        renderWithReadings()
        await act(async () => {
          fireEvent.click(downloadButton())
        })
        await act(async () => {
          await vi.advanceTimersByTimeAsync(4000)
        })
        expect(mockedToBlob).toHaveBeenCalled()
        expect(lastPdfProps().hydrographImage).toBeNull()
        expect(lastPdfProps().staffBySampleId).toEqual({ 101: 'Jordan Tate', 102: 'Ethan Mamer' })
      } finally {
        vi.useRealTimers()
      }
    })

    it('still downloads with blank Method / Staff when the sample lookup fails', async () => {
      mockedGetOne.mockRejectedValue(new Error('offline'))
      renderWithReadings()
      await act(async () => {
        fireEvent.click(downloadButton())
      })
      await waitFor(() => expect(mockedToBlob).toHaveBeenCalled())
      expect(lastPdfProps().sampleMethodsBySampleId).toEqual({})
      expect(lastPdfProps().staffBySampleId).toEqual({})
    })
  })
})
