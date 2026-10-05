// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import {
  clampTimeWindow,
  FULL_ZOOM_WINDOW,
  keepZoomWheelOffPage,
  padTimeWindow,
  passPlainWheelToPage,
  readZoomWindow,
  resolveZoomBox,
  scaleZoomWindow,
  selectionVisibility,
  timeWindowFromZoomEvent,
  type ZoomBoxChart,
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

  it('lets Shift+wheel through to zoom the chart', () => {
    const { canvas, chartWheel, cleanup } = setup()

    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 100,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
    )

    expect(chartWheel).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('no longer lets Ctrl+wheel (or a trackpad pinch) zoom the chart', () => {
    const { canvas, chartWheel, cleanup } = setup()
    const event = new WheelEvent('wheel', {
      deltaY: 100,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })

    canvas.dispatchEvent(event)

    expect(chartWheel).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    cleanup()
  })

  it('stops intercepting once cleaned up', () => {
    const { canvas, chartWheel, cleanup } = setup()
    cleanup()

    canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

    expect(chartWheel).toHaveBeenCalledTimes(1)
  })
})

const EXTENT = { min: 1_000, max: 2_000 }

describe('clampTimeWindow', () => {
  it('keeps a window that sits inside the extent', () => {
    expect(
      clampTimeWindow({ startValue: 1_200, endValue: 1_400 }, EXTENT)
    ).toEqual({ startValue: 1_200, endValue: 1_400 })
  })

  it('trims a window that hangs past either end', () => {
    expect(
      clampTimeWindow({ startValue: 900, endValue: 1_400 }, EXTENT)
    ).toEqual({ startValue: 1_000, endValue: 1_400 })
  })

  it('collapses a window covering the whole extent to the full view', () => {
    expect(
      clampTimeWindow({ startValue: 900, endValue: 2_100 }, EXTENT)
    ).toBeNull()
  })

  it('drops a window that no longer overlaps the extent', () => {
    expect(
      clampTimeWindow({ startValue: 2_500, endValue: 3_000 }, EXTENT)
    ).toBeNull()
  })
})

describe('timeWindowFromZoomEvent', () => {
  it('resolves percentages against the axis extent', () => {
    expect(timeWindowFromZoomEvent({ start: 20, end: 40 }, EXTENT)).toEqual({
      startValue: 1_200,
      endValue: 1_400,
    })
  })

  it('reads the batch a wheel or drag zoom reports', () => {
    expect(
      timeWindowFromZoomEvent({ batch: [{ start: 50, end: 75 }] }, EXTENT)
    ).toEqual({ startValue: 1_500, endValue: 1_750 })
  })

  it('takes values as given', () => {
    expect(
      timeWindowFromZoomEvent({ startValue: 1_100, endValue: 1_300 }, EXTENT)
    ).toEqual({ startValue: 1_100, endValue: 1_300 })
  })

  it('reports the full view as null', () => {
    expect(timeWindowFromZoomEvent({ start: 0, end: 100 }, EXTENT)).toBeNull()
  })

  it('reports nothing for an event without a window', () => {
    expect(timeWindowFromZoomEvent({}, EXTENT)).toBeUndefined()
  })
})

describe('padTimeWindow', () => {
  const range = { startTime: new Date(1_400), endTime: new Date(1_600) }

  it('frames the selection with a margin on each side', () => {
    expect(padTimeWindow(range, EXTENT)).toEqual({
      startValue: 1_390,
      endValue: 1_610,
    })
  })

  it('stops the margin at the ends of the extent', () => {
    expect(
      padTimeWindow(
        { startTime: new Date(1_000), endTime: new Date(1_200) },
        EXTENT
      )
    ).toEqual({ startValue: 1_000, endValue: 1_210 })
  })
})

describe('selectionVisibility', () => {
  const range = { startTime: new Date(1_400), endTime: new Date(1_600) }

  it('has nothing to report without a selection', () => {
    expect(selectionVisibility(null, null)).toBe('none')
  })

  it('shows every selection at full extent', () => {
    expect(selectionVisibility(range, null)).toBe('visible')
  })

  it('tells whether the window shows all, part or none of it', () => {
    expect(
      selectionVisibility(range, { startValue: 1_300, endValue: 1_700 })
    ).toBe('visible')
    expect(
      selectionVisibility(range, { startValue: 1_500, endValue: 1_700 })
    ).toBe('partial')
    expect(
      selectionVisibility(range, { startValue: 1_700, endValue: 1_900 })
    ).toBe('hidden')
  })
})

describe('keepZoomWheelOffPage', () => {
  const wheel = (modifier: 'shiftKey' | 'ctrlKey' | null) =>
    new WheelEvent('wheel', {
      deltaY: 100,
      ...(modifier ? { [modifier]: true } : {}),
      bubbles: true,
      cancelable: true,
    })

  const setup = () => {
    const card = document.createElement('div')
    // An axis label, legend or toolbar button: nothing there zooms the chart.
    const offPlot = document.createElement('div')
    card.appendChild(offPlot)
    document.body.appendChild(card)
    return { offPlot, cleanup: keepZoomWheelOffPage(card) }
  }

  it('keeps Shift+wheel off the chart plot from scrolling the page', () => {
    const { offPlot, cleanup } = setup()
    const event = wheel('shiftKey')

    offPlot.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    cleanup()
  })

  it('leaves Ctrl+wheel to the browser', () => {
    const { offPlot, cleanup } = setup()
    const event = wheel('ctrlKey')

    offPlot.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    cleanup()
  })

  it('leaves a plain wheel to scroll the page', () => {
    const { offPlot, cleanup } = setup()
    const event = wheel(null)

    offPlot.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    cleanup()
  })

  it('stops guarding once cleaned up', () => {
    const { offPlot, cleanup } = setup()
    cleanup()
    const event = wheel('shiftKey')

    offPlot.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })
})

describe('resolveZoomBox', () => {
  // Two stacked 100px panels, 0-100 and 120-220 down the surface. Time runs
  // 10 units a pixel from x = 0; each panel's value is its pixel row.
  const panels = [
    { top: 0, bottom: 100 },
    { top: 120, bottom: 220 },
  ]
  const chart: ZoomBoxChart = {
    containPixel: ({ gridIndex }, [, y]) =>
      y >= panels[gridIndex].top && y <= panels[gridIndex].bottom,
    convertFromPixel: ({ gridIndex }, [x, y]) => [
      x * 10,
      y - panels[gridIndex].top,
    ],
  }

  it('zooms time to the width and the panel it was drawn in to the height', () => {
    expect(resolveZoomBox({ x: 50, y: 150 }, { x: 20, y: 130 }, chart, 2)).toEqual(
      {
        time: { startValue: 200, endValue: 500 },
        gridIndex: 1,
        value: { min: 10, max: 30 },
      }
    )
  })

  it('zooms time only for a box too flat to mean a value range', () => {
    expect(
      resolveZoomBox({ x: 20, y: 40 }, { x: 60, y: 42 }, chart, 2)
    ).toMatchObject({ gridIndex: 0, value: null })
  })

  it('ignores a box too narrow to mean a time range', () => {
    expect(resolveZoomBox({ x: 20, y: 10 }, { x: 22, y: 90 }, chart, 2)).toBeNull()
  })

  it('ignores a box started off every panel', () => {
    expect(resolveZoomBox({ x: 20, y: 110 }, { x: 60, y: 150 }, chart, 2)).toBeNull()
  })
})
