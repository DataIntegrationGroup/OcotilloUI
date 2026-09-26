// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import {
  FULL_ZOOM_WINDOW,
  passPlainWheelToPage,
  readZoomWindow,
  scaleZoomWindow,
} from '@/components/Hydrographs/chartViewport'

describe('scaleZoomWindow', () => {
  it('zooms in about the center of the window', () => {
    expect(scaleZoomWindow({ start: 20, end: 60 }, 0.5)).toEqual({
      start: 30,
      end: 50,
    })
  })

  it('slides a widened window back inside the extent', () => {
    expect(scaleZoomWindow({ start: 80, end: 100 }, 2)).toEqual({
      start: 60,
      end: 100,
    })
    expect(scaleZoomWindow({ start: 0, end: 10 }, 2)).toEqual({
      start: 0,
      end: 20,
    })
  })

  it('never zooms out past the full extent', () => {
    expect(scaleZoomWindow({ start: 10, end: 90 }, 2)).toEqual(
      FULL_ZOOM_WINDOW
    )
  })

  it('stops at a minimum span when zooming in', () => {
    const { start, end } = scaleZoomWindow({ start: 50, end: 50.2 }, 0.5)
    expect(end - start).toBeCloseTo(0.5)
  })
})

describe('readZoomWindow', () => {
  it('reads the first dataZoom window', () => {
    expect(
      readZoomWindow({ dataZoom: [{ start: 5, end: 15 }, { start: 0 }] })
    ).toEqual({ start: 5, end: 15 })
  })

  it('falls back to the full extent when the chart has no window', () => {
    expect(readZoomWindow({})).toEqual(FULL_ZOOM_WINDOW)
    expect(readZoomWindow(null)).toEqual(FULL_ZOOM_WINDOW)
  })
})

describe('passPlainWheelToPage', () => {
  const setup = () => {
    const container = document.createElement('div')
    const canvas = document.createElement('div')
    container.appendChild(canvas)
    document.body.appendChild(container)
    // Stands in for zrender, which cancels every wheel it receives.
    const chartWheel = vi.fn((event: Event) => event.preventDefault())
    canvas.addEventListener('wheel', chartWheel)
    const cleanup = passPlainWheelToPage(container)
    return { canvas, chartWheel, cleanup }
  }

  it('keeps a plain wheel away from the chart so the page scrolls', () => {
    const { canvas, chartWheel, cleanup } = setup()
    const event = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    })

    canvas.dispatchEvent(event)

    expect(chartWheel).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    cleanup()
  })

  it('lets Ctrl+wheel (and trackpad pinch) through to zoom the chart', () => {
    const { canvas, chartWheel, cleanup } = setup()

    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 100,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    )

    expect(chartWheel).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('stops intercepting once cleaned up', () => {
    const { canvas, chartWheel, cleanup } = setup()
    cleanup()

    canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

    expect(chartWheel).toHaveBeenCalledTimes(1)
  })
})
