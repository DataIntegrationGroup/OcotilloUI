// @vitest-environment jsdom
/**
 * Field Compilation Notes parity: the PDF preview, the well page's Download and
 * the batch export must print the same rows, level statuses, DTW values and
 * chart year span from one fixture — including a null level status and a
 * reading without a per-observation MP height.
 */
import { createElement } from 'react'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

// ─── One fixture: the details payload + the full observation history ────────

const well = { id: 217, name: 'WL-0217' }

const obs = (
  id: number,
  date: string,
  bgs: number,
  mp: number | null,
  reason: string | null,
  levelStatus: string | null,
  sampleId: number
) => ({
  id,
  observation_datetime: `${date}T17:00:00Z`,
  value: mp == null ? null : bgs + mp,
  depth_to_water_bgs: bgs,
  measuring_point_height: mp,
  groundwater_level_reason: reason,
  level_status: levelStatus,
  sample_id: sampleId,
})

// (a) null reason and null level_status  (b) no per-observation MP height
// (c) reason padded with whitespace       (d) reason null, level_status set
const NEWEST = obs(1, '2026-10-21', 39.52, 2.1, null, null, 102)
const NO_MP = obs(2, '2026-04-14', 39.18, null, '  Water level not affected  ', null, 101)
const FALLBACK = obs(3, '2025-10-28', 39.71, 2.1, null, 'Site was pumped recently', 100)
// Older history that is not in the 25 newest field events (chart / year span only)
const HISTORY = [
  obs(10, '2018-04-17', 37.9, 2.1, 'Water level not affected', null, 90),
  obs(11, '2021-10-19', 39.0, 2.1, 'Water level not affected', null, 91),
  FALLBACK,
  NO_MP,
  NEWEST,
]

const event = (o: ReturnType<typeof obs>, method: string | null, staff: string | null) => ({
  id: 7000 + o.id,
  event_date: o.observation_datetime,
  notes: null,
  field_activities: [
    {
      id: 8000 + o.id,
      notes: null,
      samples: [
        {
          id: o.sample_id,
          sample_method: method,
          contact: staff ? { name: staff } : null,
          notes: null,
          observations: [o],
        },
      ],
    },
  ],
})

const DETAILS = {
  well,
  contacts: [],
  sensors: [],
  deployments: [],
  well_screens: [],
  field_events: [
    event(NEWEST, 'Electric tape', 'Ethan Mamer'),
    event(NO_MP, 'Steel tape', 'Jordan Tate'),
    event(FALLBACK, null, null),
  ],
}

const provider = {
  custom: vi.fn(async () => ({ data: DETAILS })),
  getList: vi.fn(async () => ({ data: HISTORY, total: HISTORY.length })),
  getOne: vi.fn(async ({ id }: { id: number }) => ({
    data: { 101: { sample_method: 'Steel tape' }, 102: { sample_method: 'Electric tape' } }[id] ?? {},
  })),
}

// ─── Module seams (data provider, renderer, chart) ───────────────────────────

const pdfCalls: any[] = []

vi.mock('@refinedev/core', async () => {
  const actual = await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')
  return {
    ...actual,
    useDataProvider: () => () => provider,
    useOne: () => ({ result: undefined, query: { isLoading: false } }),
    useList: () => ({ result: { data: [] }, query: { isLoading: false } }),
    useGo: () => vi.fn(),
    useNotification: () => ({ open: vi.fn() }),
  }
})
vi.mock('@refinedev/mui', () => ({
  useDataGrid: () => ({ dataGridProps: { rows: [], loading: false } }),
}))
vi.mock('react-router', () => ({ useParams: () => ({ id: '217' }) }))
vi.mock('@react-pdf/renderer', async () => ({
  ...(await vi.importActual<typeof import('@react-pdf/renderer')>('@react-pdf/renderer')),
  pdf: (element: any) => {
    pdfCalls.push(element.props)
    return { toBlob: async () => new Blob() }
  },
}))
vi.mock('@/components', () => ({ FieldCompilationNotesPdf: () => null }))
vi.mock('@/components/pdf/chemistry', () => ({
  downloadChemistryReport: vi.fn(),
  CHEMISTRY_REPORT_DEFAULT_SECTIONS: { waterLevels: false, continuousMonitoring: false },
}))
vi.mock('@/components/pdf/chemistry/wellQrCode', () => ({
  buildWeaverQrDataUrl: async () => null,
  buildWellMapsQrDataUrl: async () => null,
}))
// Chart stand-in: signals completion the way the real exporter's `finished` does.
vi.mock('@/components/HydrographPngExporter', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  return {
    HydrographPngExporter: ({ onPngReady }: { onPngReady: (png: string) => void }) => {
      useEffect(() => onPngReady('data:image/png;base64,HYD'), [])
      return null
    },
  }
})
vi.mock('@/hooks', () => ({
  useAccessCapabilities: () => ({ isLoading: false, canEditAmp: true, canViewConfidential: true }),
  useWellChemistryReport: () => ({ reportYear: 2026, hasChemistry: false, isLoading: false }),
}))

import { useWellPdfData } from '@/hooks/useWellPdfData'
import { fetchWellCompilationData, levelStatusOf } from '@/hooks/useWellCompilationData'
import { WellPDFActionsButton } from '@/components/Button/WellPDFActions'
import { TooltipProvider } from '@/components/ui/tooltip'
import { buildFieldSheetModel } from '@/components/pdf/fieldCompilation/FieldCompilationNotesPage'

const client = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })

/** What the sheet prints from a path's rows + year span. */
const printed = (rows: readonly any[], yearSpan: string) => {
  const m = buildFieldSheetModel({
    well: well as any,
    contacts: [],
    assets: [],
    observations: rows,
    sensorDeployments: [],
    sampleMethodsBySampleId: {},
    includeConfidentialContacts: true,
    yearSpan,
  })
  return {
    rows: rows.map((r) => [
      r.observation_datetime,
      r.depth_to_water_bgs,
      r.measuring_point_height ?? null,
      r.level_status,
    ]),
    statuses: rows.map(levelStatusOf),
    lastMeasurements: m.lastRows.map((r) => [r.date, r.dtw, r.status]),
    readings: m.readings.map((r) => [r.date, r.bgs, r.status]),
    yearSpan: m.yearSpan,
  }
}

const preview = async () => {
  const qc = client()
  const { result } = renderHook(() => useWellPdfData({ thingId: 217 }), {
    wrapper: ({ children }) => createElement(QueryClientProvider, { client: qc }, children),
  })
  await waitFor(() => {
    expect(result.current.observations.length).toBe(3)
    expect(result.current.yearSpan).not.toBe('')
  })
  return printed(result.current.observations, result.current.yearSpan)
}

const download = async () => {
  pdfCalls.length = 0
  URL.createObjectURL = vi.fn(() => 'blob:pdf')
  URL.revokeObjectURL = vi.fn()
  const qc = client()
  render(
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(
        TooltipProvider,
        null,
        createElement(WellPDFActionsButton, {
          isPreviewLoading: false,
          isDownloadLoading: false,
          well: well as any,
          observations: [],
          assets: [],
          contacts: [],
        })
      )
    )
  )
  // the well page renders once its details query has loaded
  await waitFor(() => expect(qc.getQueryData(['well-details', '217'])).toBeTruthy())
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^download/i }))
  })
  await waitFor(() => expect(pdfCalls.length).toBe(1))
  return printed(pdfCalls[0].observations, pdfCalls[0].yearSpan)
}

const batch = async () => {
  const { model } = await fetchWellCompilationData(provider as any, 217)
  return printed(model.rows, model.yearSpan)
}

describe('Field Compilation Notes — one adapter for preview, Download and batch', () => {
  it('prints identical rows, statuses, DTW and year span on all three paths', async () => {
    const fromPreview = await preview()
    const fromDownload = await download()
    const fromBatch = await batch()

    expect(fromDownload).toEqual(fromPreview)
    expect(fromBatch).toEqual(fromPreview)

    // statuses: null stays blank, reason trimmed, level_status as fallback
    expect(fromPreview.statuses).toEqual([
      '',
      'Water level not affected',
      'Site was pumped recently',
    ])
    // DTW below MP: blank where the reading has no per-observation MP height
    expect(fromPreview.lastMeasurements).toEqual([
      ['10/21/2026', '41.62', ''],
      ['04/14/2026', '', 'Water level not affected'],
    ])
    // page 2 prints the bgs depth for every row, status blank where null
    expect(fromPreview.readings).toEqual([
      ['10/21/2026', '39.52', ''],
      ['04/14/2026', '39.18', 'Water level not affected'],
      ['10/28/2025', '39.71', 'Site was pumped recently'],
    ])
    // chart title: full history (2018), not the printed rows (2025–2026)
    expect(fromPreview.yearSpan).toBe('2018–2026')
  })
})
