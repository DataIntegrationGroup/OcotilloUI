// @vitest-environment jsdom
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OcotilloHydrographCorrectionWorkbench } from '@/components/Hydrographs/OcotilloHydrographCorrectionWorkbench'

const chartInstance = {
  dispatchAction: vi.fn(),
  getOption: vi.fn(() => ({ dataZoom: [{ start: 0, end: 100 }] })),
  getDataURL: vi.fn(() => 'data:image/png;base64,'),
  resize: vi.fn(),
}

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
  default: forwardRef((props: { onEvents?: typeof chartEvents }, ref) => {
    chartEvents = props.onEvents ?? {}
    const canvasRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => ({
      getEchartsInstance: () => chartInstance,
    }))
    // Native rather than React's onWheel, which React registers as passive.
    useEffect(() => {
      const canvas = canvasRef.current
      const cancel = (event: Event) => event.preventDefault()
      canvas?.addEventListener('wheel', cancel, { passive: false })
      return () => canvas?.removeEventListener('wheel', cancel)
    }, [])
    return <div ref={canvasRef} data-testid="chart-canvas" />
  }),
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
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    canvas.dispatchEvent(zoom)
    expect(zoom.defaultPrevented).toBe(true)
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
})
