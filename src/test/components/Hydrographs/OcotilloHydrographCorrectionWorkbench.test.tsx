// @vitest-environment jsdom
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OcotilloHydrographCorrectionWorkbench } from '@/components/Hydrographs/OcotilloHydrographCorrectionWorkbench'
import type { ParsedHydrographUpload } from '@/components/Hydrographs/hydrographCorrection'

const chartInstance = {
  dispatchAction: vi.fn(),
  getOption: vi.fn(() => ({ dataZoom: [{ start: 0, end: 100 }] })),
  getDataURL: vi.fn(() => 'data:image/png;base64,'),
  resize: vi.fn(),
  // The DTW panel (grid 1) spans pixel rows 100-500 of the surface; time
  // runs a day every 10px from DAY_ONE and depth a foot a pixel from row 100.
  containPixel: vi.fn(
    ({ gridIndex }: { gridIndex: number }, [, y]: number[]) =>
      gridIndex === 1 && y >= 100 && y <= 500
  ),
  convertFromPixel: vi.fn((_: unknown, [x, y]: number[]) => [
    day(x / 10),
    y - 100,
  ]),
}

interface YAxisOption {
  min?: number | null
  max?: number | null
}

// The option the workbench last handed the chart.
let chartOption: { yAxis?: YAxisOption[] } = {}

// Presses that reach the chart surface, where zrender would start a pan.
const chartPresses = vi.fn()

type ChartEventHandler = (params: unknown) => void

// The handlers the workbench last bound, so tests can play chart events.
let chartEvents: Record<string, ChartEventHandler> = {}

const emitChartEvent = (name: string, params: unknown) =>
  act(() => {
    chartEvents[name]?.(params)
  })

// ECharts needs a canvas jsdom does not have. The stand-in exposes the same
// instance handle and a surface that, like zrender, cancels every wheel.
vi.mock('echarts-for-react', () => ({
  default: forwardRef(
    (
      props: { onEvents?: typeof chartEvents; option?: typeof chartOption },
      ref
    ) => {
    chartEvents = props.onEvents ?? {}
    chartOption = props.option ?? {}
    const canvasRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => ({
      getEchartsInstance: () => chartInstance,
    }))
    // Native rather than React's onWheel, which React registers as passive.
    useEffect(() => {
      const canvas = canvasRef.current
      const cancel = (event: Event) => event.preventDefault()
      canvas?.addEventListener('wheel', cancel, { passive: false })
      canvas?.addEventListener('mousedown', chartPresses)
      return () => {
        canvas?.removeEventListener('wheel', cancel)
        canvas?.removeEventListener('mousedown', chartPresses)
      }
    }, [])
    return <div ref={canvasRef} data-testid="chart-canvas" />
    }
  ),
}))

const renderWorkbench = () =>
  render(
    <OcotilloHydrographCorrectionWorkbench
      thingName="TEST-0001"
      manualObservations={[]}
      transducerObservations={[]}
    />
  )

const DAY_MS = 24 * 60 * 60 * 1000
const DAY_ONE = Date.UTC(2024, 0, 1)
const day = (offset: number) => DAY_ONE + offset * DAY_MS

// One reading a day for `days` days from DAY_ONE, so the time axis runs
// from day(0) to day(days - 1).
const dailyReadings = (days: number) =>
  Array.from({ length: days }, (_, index) => ({
    observation_datetime: new Date(day(index)),
    value: 10 + index / 100,
  }))

const workbenchWithReadings = (days: number) => (
  <OcotilloHydrographCorrectionWorkbench
    thingName="TEST-0001"
    manualObservations={[]}
    transducerObservations={dailyReadings(days)}
  />
)

describe('OcotilloHydrographCorrectionWorkbench chart tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pins the chart tools to the top of the page while it scrolls', () => {
    renderWorkbench()

    const toolbar = screen.getByRole('toolbar', { name: 'Chart tools' })
    expect(getComputedStyle(toolbar).position).toBe('sticky')
    for (const name of [
      'Select range',
      'Zoom in',
      'Zoom out',
      'Zoom to selection',
      'Reset zoom',
      'Hover popup',
      'Save chart as image',
    ]) {
      expect(
        screen.getByRole('button', { name }),
        `missing ${name}`
      ).toBeTruthy()
    }
    expect(screen.getByText('Selection: entire uploaded trace')).toBeTruthy()
  })

  it('toggles range selection on the chart', async () => {
    const user = userEvent.setup()
    renderWorkbench()
    const selectRange = screen.getByRole('button', { name: 'Select range' })

    await user.click(selectRange)
    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType: 'lineX', brushMode: 'single' },
    })
    expect(selectRange.getAttribute('aria-pressed')).toBe('true')

    await user.click(selectRange)
    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType: false, brushMode: 'single' },
    })
    expect(selectRange.getAttribute('aria-pressed')).toBe('false')
  })

  it('zooms from the toolbar', async () => {
    const user = userEvent.setup()
    renderWorkbench()

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'dataZoom',
      start: 25,
      end: 75,
    })

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }))
    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'dataZoom',
      start: 0,
      end: 100,
    })
  })

  it('leaves a plain wheel over the chart to scroll the page', () => {
    renderWorkbench()
    const canvas = screen.getByTestId('chart-canvas')

    const plain = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    })
    canvas.dispatchEvent(plain)
    expect(plain.defaultPrevented).toBe(false)

    const zoom = new WheelEvent('wheel', {
      deltaY: 100,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    canvas.dispatchEvent(zoom)
    expect(zoom.defaultPrevented).toBe(true)

    // Ctrl+wheel is no longer a chart gesture: the chart never sees it.
    const ctrl = new WheelEvent('wheel', {
      deltaY: 100,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    canvas.dispatchEvent(ctrl)
    expect(ctrl.defaultPrevented).toBe(false)
  })

  it('keeps a zoomed view on the same period when the data extent grows', () => {
    const { rerender } = render(workbenchWithReadings(11))

    // 20–40% of a ten-day axis.
    emitChartEvent('datazoom', { batch: [{ start: 20, end: 40 }] })
    chartInstance.dispatchAction.mockClear()

    // More stored data arrives, doubling the axis. Left alone, ECharts would
    // keep 20–40% and show days 4–8 instead.
    rerender(workbenchWithReadings(21))

    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'dataZoom',
      startValue: day(2),
      endValue: day(4),
    })
  })

  it('leaves the full view to follow the extent as it grows', () => {
    const { rerender } = render(workbenchWithReadings(11))
    chartInstance.dispatchAction.mockClear()

    rerender(workbenchWithReadings(21))

    expect(chartInstance.dispatchAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'dataZoom' })
    )
  })

  it('flags a selection zoomed out of view and frames it on request', async () => {
    const user = userEvent.setup()
    render(workbenchWithReadings(11))

    emitChartEvent('brushSelected', {
      batch: [{ areas: [{ coordRange: [day(5), day(7)] }] }],
    })
    expect(screen.getByText(/^Selection: .*[^)]$/)).toBeTruthy()

    emitChartEvent('datazoom', { start: 0, end: 10 })
    expect(screen.getByText(/^Selection: .*\(out of view\)$/)).toBeTruthy()

    emitChartEvent('datazoom', { start: 0, end: 60 })
    expect(
      screen.getByText(/^Selection: .*\(partly out of view\)$/)
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Zoom to selection' }))
    // The two-day selection plus 5% each side.
    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'dataZoom',
      startValue: day(5) - 0.1 * DAY_MS,
      endValue: day(7) + 0.1 * DAY_MS,
    })
  })

  it('resets to the full time range of every series', async () => {
    const user = userEvent.setup()
    render(workbenchWithReadings(11))
    emitChartEvent('brushSelected', {
      batch: [{ areas: [{ coordRange: [day(5), day(7)] }] }],
    })
    emitChartEvent('datazoom', { start: 0, end: 10 })

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }))

    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'dataZoom',
      start: 0,
      end: 100,
    })
    expect(screen.queryByText(/out of view/)).toBeNull()
  })

  // Drags from one surface pixel to another. jsdom lays nothing out, so a
  // client position is a position on the chart surface.
  const dragOnChart = (
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    const canvas = screen.getByTestId('chart-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: from.x, clientY: from.y })
    fireEvent.mouseMove(window, { clientX: to.x, clientY: to.y })
    fireEvent.mouseUp(window, { clientX: to.x, clientY: to.y })
  }

  it('zooms to a box dragged on the chart without touching the selection', async () => {
    const user = userEvent.setup()
    render(workbenchWithReadings(11))
    emitChartEvent('brushSelected', {
      batch: [{ areas: [{ coordRange: [day(5), day(7)] }] }],
    })
    const selectionChip = screen.getByText(/^Selection: /).textContent

    const zoomBox = screen.getByRole('button', { name: 'Zoom box' })
    await user.click(zoomBox)
    expect(zoomBox.getAttribute('aria-pressed')).toBe('true')
    chartInstance.dispatchAction.mockClear()

    // Days 2-6, 20-60 ft down the DTW panel, drawn right to left.
    dragOnChart({ x: 60, y: 160 }, { x: 20, y: 120 })

    expect(chartPresses).not.toHaveBeenCalled()
    expect(chartInstance.dispatchAction).toHaveBeenCalledTimes(1)
    expect(chartInstance.dispatchAction).toHaveBeenCalledWith({
      type: 'dataZoom',
      startValue: day(2),
      endValue: day(6),
    })
    expect(chartOption.yAxis?.[1]).toMatchObject({ min: 20, max: 60 })
    expect(screen.getByText(/^Selection: /).textContent).toBe(selectionChip)
  })

  it('draws the zoom box while it is dragged', async () => {
    const user = userEvent.setup()
    render(workbenchWithReadings(11))
    await user.click(screen.getByRole('button', { name: 'Zoom box' }))
    const canvas = screen.getByTestId('chart-canvas')

    fireEvent.mouseDown(canvas, { button: 0, clientX: 20, clientY: 120 })
    fireEvent.mouseMove(window, { clientX: 60, clientY: 160 })
    expect(screen.getByTestId('zoom-box')).toBeTruthy()

    fireEvent.mouseUp(window, { clientX: 60, clientY: 160 })
    expect(screen.queryByTestId('zoom-box')).toBeNull()
  })

  it('leaves the chart to pan once the zoom box is switched off', async () => {
    const user = userEvent.setup()
    render(workbenchWithReadings(11))
    const zoomBox = screen.getByRole('button', { name: 'Zoom box' })
    await user.click(zoomBox)
    await user.click(zoomBox)
    chartInstance.dispatchAction.mockClear()

    dragOnChart({ x: 20, y: 120 }, { x: 60, y: 160 })

    expect(chartPresses).toHaveBeenCalled()
    expect(chartInstance.dispatchAction).not.toHaveBeenCalled()
  })

  it('switches between selecting and the zoom box', async () => {
    const user = userEvent.setup()
    render(workbenchWithReadings(11))
    const selectRange = screen.getByRole('button', { name: 'Select range' })
    const zoomBox = screen.getByRole('button', { name: 'Zoom box' })

    await user.click(selectRange)
    await user.click(zoomBox)

    // The brush hands the cursor back so a drag draws the box, not a range.
    expect(chartInstance.dispatchAction).toHaveBeenLastCalledWith({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType: false, brushMode: 'single' },
    })
    expect(selectRange.getAttribute('aria-pressed')).toBe('false')
    expect(zoomBox.getAttribute('aria-pressed')).toBe('true')
  })

  it('releases a pinned value axis on reset', async () => {
    const user = userEvent.setup()
    render(workbenchWithReadings(11))
    await user.click(screen.getByRole('button', { name: 'Zoom box' }))
    dragOnChart({ x: 20, y: 120 }, { x: 60, y: 160 })
    expect(chartOption.yAxis?.[1]).toMatchObject({ min: 20, max: 60 })

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }))

    expect(chartOption.yAxis?.[1]).toMatchObject({ min: null, max: null })
  })

  it('keeps Shift+wheel off the toolbar from scrolling the page', () => {
    renderWorkbench()
    const toolbar = screen.getByRole('toolbar', { name: 'Chart tools' })
    const event = new WheelEvent('wheel', {
      deltaY: 100,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    toolbar.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('keeps Shift+wheel off the chart card from scrolling the page', () => {
    renderWorkbench()
    const heading = screen.getByText('HydroSync Workspace')
    const event = new WheelEvent('wheel', {
      deltaY: 100,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    heading.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('keeps the well in the pinned chart tools', () => {
    renderWorkbench()
    const toolbar = screen.getByRole('toolbar', { name: 'Chart tools' })
    expect(toolbar.textContent).toContain('Well: TEST-0001')
  })

  it('names the well on the publish button', () => {
    render(
      <OcotilloHydrographCorrectionWorkbench
        thingName="TEST-0001"
        manualObservations={[]}
        transducerObservations={[]}
        onPublish={vi.fn(async () => {})}
      />
    )
    expect(
      screen.getByRole('button', { name: 'Publish TEST-0001 to Ocotillo' })
    ).toBeTruthy()
  })

  it('holds the publish button while the caller is still publishing', () => {
    render(
      <OcotilloHydrographCorrectionWorkbench
        thingName="TEST-0001"
        manualObservations={[]}
        transducerObservations={[]}
        onPublish={vi.fn(async () => {})}
        publishInProgress
      />
    )
    const button = screen.getByRole('button', { name: 'Publishing...' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('OcotilloHydrographCorrectionWorkbench automated cleaning (hidden)', () => {
  it('hides the automated Clean tools but keeps manual deletion', async () => {
    const user = userEvent.setup()
    render(
      <OcotilloHydrographCorrectionWorkbench
        thingName="TEST-0001"
        manualObservations={[]}
        transducerObservations={[]}
        initialUpload={{
          pointId: 'TEST-0001',
          detectedDelimiter: ',',
          detectedValueColumn: 'Water Head',
          detectedTimeColumn: 'Date Time',
          valueKind: 'water_head',
          measurements: [1, 2, 3].map((value, index) => ({
            time: new Date(day(index)),
            value,
          })),
        }}
        initialFileName="test.csv"
      />
    )

    expect(screen.queryByText('Clean')).toBeNull()
    await user.click(screen.getByText('Delete Readings'))

    expect(screen.queryByLabelText('Correct drift')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Remove Offsets/Zeros' })
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: /Reflections/ })
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Delete Selected Readings...' })
    ).toBeTruthy()

    // Manual tools are untouched.
    for (const title of ['Shift', 'Snap']) {
      expect(screen.getByText(title)).toBeTruthy()
    }
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy()
  })
})

describe('OcotilloHydrographCorrectionWorkbench deleting selected readings', () => {
  // Five daily readings; the two in the middle are sensor-out-of-well junk.
  const upload: ParsedHydrographUpload = {
    pointId: 'TEST-0001',
    detectedDelimiter: ',',
    detectedValueColumn: 'Depth To Water',
    detectedTimeColumn: 'Date Time',
    valueKind: 'depth_to_water',
    measurements: [42, 99, 98, 42.1, 42.2].map((value, index) => ({
      time: new Date(day(index)),
      value,
    })),
  }

  const renderWithUpload = async () => {
    const user = userEvent.setup()
    const onPublish = vi.fn().mockResolvedValue(undefined)
    render(
      <OcotilloHydrographCorrectionWorkbench
        thingName="TEST-0001"
        manualObservations={[]}
        transducerObservations={[]}
        initialUpload={upload}
        initialFileName="test.csv"
        onPublish={onPublish}
      />
    )
    await user.click(screen.getByText('Delete Readings'))
    return { user, onPublish }
  }

  const selectDays = (start: number, end: number) =>
    emitChartEvent('brushSelected', {
      batch: [{ areas: [{ coordRange: [day(start), day(end)] }] }],
    })

  const deleteButton = () =>
    screen.getByRole('button', { name: 'Delete Selected Readings...' })

  // The dialog hides the rest of the page from the accessibility tree until
  // its exit transition finishes.
  const dialogClosed = () =>
    waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('needs a selection before anything can be deleted', async () => {
    await renderWithUpload()

    expect(deleteButton()).toHaveProperty('disabled', true)
  })

  it('refuses a selection that covers every reading', async () => {
    await renderWithUpload()
    selectDays(0, 4)

    expect(deleteButton()).toHaveProperty('disabled', true)
    expect(screen.getByText(/covers every reading/)).toBeTruthy()
  })

  it('keeps the readings when the prompt is cancelled', async () => {
    const { user, onPublish } = await renderWithUpload()
    selectDays(1, 2)

    await user.click(deleteButton())
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/deletes 2 of 5 readings/)).toBeTruthy()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await dialogClosed()

    expect(screen.queryByTestId('remove-readings-outcome')).toBeNull()
    await user.click(
      screen.getByRole('button', { name: 'Publish TEST-0001 to Ocotillo' })
    )
    expect(onPublish.mock.calls[0][0].measurements).toHaveLength(5)
  })

  it('deletes after confirmation, reports the result, and publishes the rest', async () => {
    const { user, onPublish } = await renderWithUpload()
    selectDays(1, 2)

    await user.click(deleteButton())
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete 2 Readings',
      })
    )
    await dialogClosed()

    expect(screen.getByTestId('remove-readings-outcome').textContent).toMatch(
      /^Deleted 2 readings between .* 3 remain to publish/
    )

    await user.click(
      screen.getByRole('button', { name: 'Publish TEST-0001 to Ocotillo' })
    )
    const published = onPublish.mock.calls[0][0]
    expect(
      published.measurements.map((point: { value: number }) => point.value)
    ).toEqual([42, 42.1, 42.2])
    expect(published.corrections.at(-1)).toMatch(
      /^delete_readings \(2 readings, /
    )
  })

  it('restores deleted readings on reset', async () => {
    const { user, onPublish } = await renderWithUpload()
    selectDays(1, 2)
    await user.click(deleteButton())
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete 2 Readings',
      })
    )
    await dialogClosed()

    await user.click(screen.getByRole('button', { name: /Reset to Original/ }))

    expect(screen.queryByTestId('remove-readings-outcome')).toBeNull()
    await user.click(
      screen.getByRole('button', { name: 'Publish TEST-0001 to Ocotillo' })
    )
    expect(onPublish.mock.calls[0][0].measurements).toHaveLength(5)
  })
})
