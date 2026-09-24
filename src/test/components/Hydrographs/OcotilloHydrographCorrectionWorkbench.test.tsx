// @vitest-environment jsdom
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OcotilloHydrographCorrectionWorkbench } from '@/components/Hydrographs/OcotilloHydrographCorrectionWorkbench'

const chartInstance = {
  dispatchAction: vi.fn(),
  getOption: vi.fn(() => ({ dataZoom: [{ start: 0, end: 100 }] })),
  getDataURL: vi.fn(() => 'data:image/png;base64,'),
  resize: vi.fn(),
}

// ECharts needs a canvas jsdom does not have. The stand-in exposes the same
// instance handle and a surface that, like zrender, cancels every wheel.
vi.mock('echarts-for-react', () => ({
  default: forwardRef((_props: object, ref) => {
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
})
