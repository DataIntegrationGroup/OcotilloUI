// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// The page under test only wires data; every heavy child is a prop recorder.
const pdfProps: any[] = []
const downloadProps: any[] = []
const mockedGetOne = vi.fn(async ({ id }: { id: number }) => ({
  data: {
    101: { sample_method: 'Steel tape', contact: { name: 'Jordan Tate' } },
    102: { sample_method: 'Electric tape', contact: { name: 'Ethan Mamer' } },
  }[id],
}))

const well = {
  id: 217,
  name: 'WL-0217',
  current_location: { geometry: { coordinates: [-102.59333, 34.30155, 0] } },
}
const observations = [
  { observation_datetime: '2026-10-21T17:00:00Z', value: 41.62, depth_to_water_bgs: 39.52, sample_id: 102 },
  { observation_datetime: '2026-04-14T17:00:00Z', value: 41.28, depth_to_water_bgs: 39.18, sample_id: 101 },
]

vi.mock('@refinedev/core', () => ({
  useDataProvider: () => () => ({ getOne: mockedGetOne }),
}))
vi.mock('@refinedev/mui', () => ({
  Show: ({ children, headerButtons }: { children: React.ReactNode; headerButtons?: () => React.ReactNode }) => (
    <div>
      {headerButtons?.()}
      {children}
    </div>
  ),
}))
vi.mock('react-router', () => ({ useParams: () => ({ id: '217' }) }))
vi.mock('@react-pdf/renderer', () => ({
  PDFViewer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/pdf/chemistry/wellQrCode', () => ({
  buildWeaverQrDataUrl: async () => null,
  buildGoogleMapsQrDataUrl: async () => null,
}))
vi.mock('@/config', () => ({ PDF_DEFAULT_VALUES: {} }))
vi.mock('@/pages/ocotillo/thing/components/ReportRail', () => ({ ReportRail: () => null }))
vi.mock('@/components/OcotilloPageHeader', () => ({
  ocotilloCardHeaderProps: {},
  OcotilloHeaderButtons: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/hooks', () => ({
  useAccessCapabilities: () => ({ canEditAmp: true, canViewConfidential: true }),
  useWellPdfData: () => ({
    well,
    observations,
    assets: [],
    contacts: [],
    sensorDeployments: [],
    isLoading: false,
    progress: 100,
  }),
}))
vi.mock('@/components', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  return {
    FieldCompilationNotesPdf: (props: any) => {
      pdfProps.push(props)
      return null
    },
    WellPDFDownloadButton: (props: any) => {
      downloadProps.push(props)
      return null
    },
    WellShowTitle: () => null,
    HydrographPngExporter: ({ onPngReady }: { onPngReady: (png: string) => void }) => {
      // Like the real exporter: the PNG arrives on a timer, after the parent's
      // mount effects (which reset the image) have run.
      useEffect(() => {
        const t = setTimeout(() => onPngReady('data:image/png;base64,HYD'), 100)
        return () => clearTimeout(t)
      }, [onPngReady])
      return null
    },
  }
})

import { WellShowPdfPreview } from '@/pages/ocotillo/thing/well-show-pdf-preview'

describe('WellShowPdfPreview → FieldCompilationNotesPdf', () => {
  it('passes the sample maps and the hydrograph image to the viewer and the download', async () => {
    render(<WellShowPdfPreview />)

    const wired = (p: any) =>
      p.hydrographImage === 'data:image/png;base64,HYD' &&
      Object.keys(p.staffBySampleId ?? {}).length > 0

    await waitFor(() => {
      expect(pdfProps.some(wired)).toBe(true)
      expect(downloadProps.some(wired)).toBe(true)
    })

    const last = pdfProps.filter(wired).at(-1)
    expect(last.sampleMethodsBySampleId).toEqual({ 101: 'Steel tape', 102: 'Electric tape' })
    expect(last.staffBySampleId).toEqual({ 101: 'Jordan Tate', 102: 'Ethan Mamer' })
    expect(downloadProps.filter(wired).at(-1).sampleMethodsBySampleId).toEqual({
      101: 'Steel tape',
      102: 'Electric tape',
    })
    expect(mockedGetOne).toHaveBeenCalledWith({ resource: 'ocotillo.sample', id: 102 })
  })
})
