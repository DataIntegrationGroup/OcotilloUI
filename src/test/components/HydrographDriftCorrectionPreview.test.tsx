// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OcotilloHydrographCorrectionWorkbench } from '@/components/Hydrographs/OcotilloHydrographCorrectionWorkbench'
import type { ParsedHydrographUpload } from '@/components/Hydrographs/hydrographCorrection'

// The automated Clean tools are hidden in the app (BDMS-1443) but the code
// stays; these tests cover it with the tools switched back on.
vi.mock('@/components/Hydrographs/hydrographUiMode', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/Hydrographs/hydrographUiMode')
  >()),
  SHOW_AUTOMATED_CLEAN: true,
}))

// ECharts needs a real canvas. The stub keeps the latest option so the tests
// can read the series the workbench would draw.
const { chartOptions } = vi.hoisted(() => ({
  chartOptions: [] as Array<{
    series: Array<{ name: string; data: Array<[Date, number]> }>
  }>,
}))

vi.mock('echarts-for-react', async () => {
  const { forwardRef } = await import('react')
  return {
    default: forwardRef(
      ({ option }: { option: (typeof chartOptions)[number] }, _ref) => {
        chartOptions.push(option)
        return null
      }
    ),
  }
})

const seriesValues = (name: string) =>
  chartOptions
    .at(-1)
    ?.series.find((entry) => entry.name === name)
    ?.data.map(([, value]) => value) ?? []

const upload: ParsedHydrographUpload = {
  pointId: 'TEST-0001',
  detectedDelimiter: ',',
  detectedValueColumn: 'Water head',
  detectedTimeColumn: 'Date Time',
  valueKind: 'water_head',
  measurements: [
    { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
    { time: new Date('2025-01-02T00:00:00Z'), value: 10.5 },
    { time: new Date('2025-01-03T00:00:00Z'), value: 9.8 },
  ],
}

// Sensor depth anchors at L0 = 50 + 10 = 60 and L1 = 52 + 9.8 = 61.8.
const manualObservations = [
  { observation_datetime: '2025-01-01T00:00:00Z', depth_to_water_bgs: 50 },
  { observation_datetime: '2025-01-03T00:00:00Z', depth_to_water_bgs: 52 },
]

const renderWorkbench = async (manuals = manualObservations) => {
  const user = userEvent.setup()
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <OcotilloHydrographCorrectionWorkbench
        thingName="TEST-0001"
        manualObservations={manuals}
        transducerObservations={[]}
        initialUpload={upload}
        initialFileName="test.csv"
      />
    </LocalizationProvider>
  )
  await user.click(screen.getByText('Clean'))
  return user
}

beforeEach(() => {
  chartOptions.length = 0
})

describe('drift correction preview', () => {
  it('previews the recalculation without applying it', async () => {
    const user = await renderWorkbench()
    expect(seriesValues('Uploaded corrected')).toEqual([51.8, 51.3, 52])

    await user.click(screen.getByLabelText('Correct drift'))

    const preview = screen.getByTestId('drift-correction-preview')
    expect(
      within(preview).getByText('Preview: drift correction on')
    ).toBeInTheDocument()
    expect(
      within(preview).getByText(/2 readings move .* by up to 1\.80 ft/)
    ).toBeInTheDocument()
    expect(
      within(preview).getByText(/60\.00 to 61\.80 ft \(drift \+1\.80 ft\)/)
    ).toBeInTheDocument()
    expect(
      within(preview).getByText('No manual edits to discard.')
    ).toBeInTheDocument()

    // The chart draws the candidate next to the unchanged working series.
    expect(seriesValues('Drift correction preview')).toEqual([50, 50.4, 52])
    expect(seriesValues('Uploaded corrected')).toEqual([51.8, 51.3, 52])
  })

  it('leaves the series untouched when the preview is cancelled', async () => {
    const user = await renderWorkbench()

    await user.click(screen.getByLabelText('Correct drift'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByTestId('drift-correction-preview')).toBeNull()
    expect(screen.getByLabelText('Correct drift')).not.toBeChecked()
    expect(seriesValues('Drift correction preview')).toEqual([])
    expect(seriesValues('Uploaded corrected')).toEqual([51.8, 51.3, 52])
  })

  it('replaces the working series when the preview is applied', async () => {
    const user = await renderWorkbench()

    await user.click(screen.getByLabelText('Correct drift'))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(screen.queryByTestId('drift-correction-preview')).toBeNull()
    expect(screen.getByLabelText('Correct drift')).toBeChecked()
    expect(seriesValues('Uploaded corrected')).toEqual([50, 50.4, 52])
    expect(seriesValues('Drift correction preview')).toEqual([])
  })

  it('lists the manual edits applying would discard', async () => {
    const user = await renderWorkbench()

    await user.click(
      screen.getByRole('button', { name: 'Remove Offsets/Zeros' })
    )
    await user.click(screen.getByLabelText('Correct drift'))

    const preview = screen.getByTestId('drift-correction-preview')
    expect(
      within(preview).getByText('Applying discards 1 manual edit:')
    ).toBeInTheDocument()
    expect(
      within(preview).getByText(/^remove_offsets_zeros/)
    ).toBeInTheDocument()
  })

  it('drops the preview when the checkbox is toggled back', async () => {
    const user = await renderWorkbench()

    await user.click(screen.getByLabelText('Correct drift'))
    await user.click(screen.getByLabelText('Correct drift'))

    expect(screen.queryByTestId('drift-correction-preview')).toBeNull()
  })

  it('names the range the staged change would move', async () => {
    const user = await renderWorkbench()

    await user.click(screen.getByLabelText('Correct drift'))

    // The reading on the closing manual already sits on its anchor, so the
    // change covers the first two readings only.
    const first = new Date('2025-01-01T00:00:00Z').toLocaleString()
    const last = new Date('2025-01-02T00:00:00Z').toLocaleString()
    expect(
      within(screen.getByTestId('drift-correction-preview')).getByText(
        `Affected range: ${first} to ${last}, shaded on the chart.`
      )
    ).toBeInTheDocument()
  })
})

describe('drift correction outcome', () => {
  it('confirms what applying changed', async () => {
    const user = await renderWorkbench()
    expect(screen.queryByTestId('drift-correction-outcome')).toBeNull()

    await user.click(screen.getByLabelText('Correct drift'))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    const outcome = screen.getByTestId('drift-correction-outcome')
    expect(
      within(outcome).getByText('Drift correction on: applied')
    ).toBeInTheDocument()
    expect(
      within(outcome).getByText(/2 of 3 readings moved, by up to 1\.80 ft/)
    ).toBeInTheDocument()
  })

  it('says so when applying changed nothing', async () => {
    // One manual gives a constant sensor depth: nothing to ramp between.
    const user = await renderWorkbench([manualObservations[0]])

    await user.click(screen.getByLabelText('Correct drift'))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    const outcome = screen.getByTestId('drift-correction-outcome')
    expect(
      within(outcome).getByText(
        'Drift correction on: applied, no readings changed'
      )
    ).toBeInTheDocument()
    expect(
      within(outcome).getByText(/there is no drift to correct/)
    ).toBeInTheDocument()
  })

  it('reports turning drift correction back off', async () => {
    const user = await renderWorkbench()
    await user.click(screen.getByLabelText('Correct drift'))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await user.click(screen.getByLabelText('Correct drift'))
    // Staging the next change clears the last outcome.
    expect(screen.queryByTestId('drift-correction-outcome')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(
      within(screen.getByTestId('drift-correction-outcome')).getByText(
        'Drift correction off: applied'
      )
    ).toBeInTheDocument()
    expect(seriesValues('Uploaded corrected')).toEqual([51.8, 51.3, 52])
  })

  it('stays until dismissed', async () => {
    const user = await renderWorkbench()
    await user.click(screen.getByLabelText('Correct drift'))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await user.click(
      within(screen.getByTestId('drift-correction-outcome')).getByRole(
        'button',
        { name: 'Close' }
      )
    )

    expect(screen.queryByTestId('drift-correction-outcome')).toBeNull()
  })
})

