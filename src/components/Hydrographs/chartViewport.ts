import { useEffect, useRef, useState, type RefObject } from 'react'

/** A dataZoom window, as percentages of the full time extent. */
export interface ZoomWindow {
  start: number
  end: number
}

export const FULL_ZOOM_WINDOW: ZoomWindow = { start: 0, end: 100 }

// Narrowest window the zoom buttons will step down to, in percent. Any
// tighter and the slider handles sit on top of each other.
const MIN_ZOOM_SPAN = 0.5

/**
 * Grows or shrinks a zoom window about its center. A factor below 1 zooms in,
 * above 1 zooms out. A window pushed past either edge slides back inside
 * instead of being cut short, so zooming out near the end of a trace still
 * widens the view by the full amount.
 */
export const scaleZoomWindow = (
  current: ZoomWindow,
  factor: number
): ZoomWindow => {
  const span = Math.min(
    100,
    Math.max(MIN_ZOOM_SPAN, (current.end - current.start) * factor)
  )
  const center = (current.start + current.end) / 2
  let start = center - span / 2
  let end = center + span / 2

  if (start < 0) {
    end -= start
    start = 0
  }
  if (end > 100) {
    start -= end - 100
    end = 100
  }

  return { start: Math.max(0, start), end: Math.min(100, end) }
}

/**
 * Reads the shared zoom window back off the chart. Every dataZoom in the
 * workbench drives all x axes together, so the first one speaks for all.
 */
export const readZoomWindow = (option: unknown): ZoomWindow => {
  const dataZoom = (option as { dataZoom?: Array<Partial<ZoomWindow>> } | null)
    ?.dataZoom?.[0]
  return {
    start: dataZoom?.start ?? FULL_ZOOM_WINDOW.start,
    end: dataZoom?.end ?? FULL_ZOOM_WINDOW.end,
  }
}

/** The span the time axis covers when fully zoomed out, in epoch ms. */
export interface TimeExtent {
  min: number
  max: number
}

/**
 * A zoom window pinned to instants on the time axis, in epoch ms. `null`
 * wherever one is expected means the chart shows its full extent.
 */
export interface TimeWindow {
  startValue: number
  endValue: number
}

/**
 * What a `datazoom` event carries. Wheel, drag and slider zooms report
 * percentages, sometimes wrapped in a batch; a dispatched window reports
 * whichever of percentages or values it was dispatched with.
 */
export interface DataZoomEventParams {
  start?: number
  end?: number
  startValue?: number
  endValue?: number
  batch?: DataZoomEventParams[]
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * Clamps a window to the extent. Anything that reaches both ends collapses to
 * `null`, so "showing everything" has one representation and keeps tracking
 * the full extent as data is added.
 */
export const clampTimeWindow = (
  view: TimeWindow | null,
  extent: TimeExtent
): TimeWindow | null => {
  if (!view) return null
  const startValue = Math.max(
    extent.min,
    Math.min(view.startValue, view.endValue)
  )
  const endValue = Math.min(
    extent.max,
    Math.max(view.startValue, view.endValue)
  )
  if (startValue <= extent.min && endValue >= extent.max) return null
  // Entirely off the axis — nothing left of it to keep.
  if (endValue <= startValue) return null
  return { startValue, endValue }
}

/**
 * Converts a `datazoom` event into the time window it left the chart at.
 * Percentages are resolved against `extent`, which must be the same extent
 * the chart's x axes use. Returns `undefined` when the event describes no
 * window, so the caller can keep what it had.
 */
export const timeWindowFromZoomEvent = (
  params: DataZoomEventParams,
  extent: TimeExtent
): TimeWindow | null | undefined => {
  const payload = params.batch?.[0] ?? params
  const span = extent.max - extent.min

  const resolve = (percent: unknown, value: unknown) => {
    if (isFiniteNumber(value)) return value
    if (isFiniteNumber(percent)) return extent.min + (span * percent) / 100
    return undefined
  }

  const startValue = resolve(payload.start, payload.startValue)
  const endValue = resolve(payload.end, payload.endValue)
  if (startValue === undefined || endValue === undefined) return undefined

  return clampTimeWindow({ startValue, endValue }, extent)
}

/**
 * The window "Zoom to selection" frames: the selection plus a margin each
 * side, so its edges and the brush handles sit inside the plot rather than
 * on its frame where they are easy to miss.
 */
export const padTimeWindow = (
  range: { startTime: Date; endTime: Date },
  extent: TimeExtent | null,
  marginFraction = 0.05
): TimeWindow => {
  const start = range.startTime.getTime()
  const end = range.endTime.getTime()
  const margin = (end - start) * marginFraction
  const padded = { startValue: start - margin, endValue: end + margin }
  if (!extent) return padded
  return {
    startValue: Math.max(extent.min, padded.startValue),
    endValue: Math.min(extent.max, padded.endValue),
  }
}

export type SelectionVisibility = 'none' | 'visible' | 'partial' | 'hidden'

/** How much of the selected range the current zoom window shows. */
export const selectionVisibility = (
  range: { startTime: Date; endTime: Date } | null,
  view: TimeWindow | null
): SelectionVisibility => {
  if (!range) return 'none'
  if (!view) return 'visible'
  const start = range.startTime.getTime()
  const end = range.endTime.getTime()
  if (end < view.startValue || start > view.endValue) return 'hidden'
  if (start < view.startValue || end > view.endValue) return 'partial'
  return 'visible'
}

/**
 * Whether a wheel event over the chart should zoom it rather than scroll the
 * page. Shift has no browser action of its own on a vertical wheel, unlike
 * Ctrl, which zooms the whole window whenever the pointer drifts off the
 * plot. Ctrl+wheel (and a trackpad pinch, which reports as Ctrl+wheel) is
 * left to the browser.
 */
export const isChartZoomWheel = (event: Pick<WheelEvent, 'shiftKey'>) =>
  event.shiftKey

/**
 * ECharts' inside zoom cancels every wheel event over a grid, even with
 * `zoomOnMouseWheel` set to a modifier, so a tall chart swallowed page
 * scrolling and the only way past it was to move the pointer to the page
 * edge. Stopping plain wheel events on the way down, before they reach the
 * canvas, leaves them to scroll the page as normal.
 *
 * Returns the cleanup that removes the listeners.
 */
export const passPlainWheelToPage = (container: HTMLElement) => {
  const handleWheel = (event: Event) => {
    if (!isChartZoomWheel(event as WheelEvent)) event.stopPropagation()
  }
  // zrender listens for both, depending on the browser.
  const eventNames = ['wheel', 'mousewheel']
  for (const name of eventNames) {
    container.addEventListener(name, handleWheel, { capture: true })
  }
  return () => {
    for (const name of eventNames) {
      container.removeEventListener(name, handleWheel, { capture: true })
    }
  }
}

/**
 * Shift+wheel in the workspace but off the plot itself — the toolbar, the axis
 * labels, the legend, the slider, the controls panel — reached the browser and
 * scrolled the page sideways, which is easy to do by accident while zooming
 * the chart.
 * Cancelling it anywhere inside `container` keeps Shift+wheel meaning "zoom
 * the chart". Over the plot the chart has already cancelled it and zoomed.
 *
 * Returns the cleanup that removes the listener.
 */
export const keepZoomWheelOffPage = (container: HTMLElement) => {
  const handleWheel = (event: WheelEvent) => {
    if (isChartZoomWheel(event)) event.preventDefault()
  }
  // Not passive, or preventDefault is ignored.
  container.addEventListener('wheel', handleWheel, { passive: false })
  return () => container.removeEventListener('wheel', handleWheel)
}

/** A point on the chart surface, in pixels from its top left corner. */
export interface ChartPixel {
  x: number
  y: number
}

/** The two instance methods a zoom box needs, so tests can stand them in. */
export interface ZoomBoxChart {
  containPixel: (finder: { gridIndex: number }, value: number[]) => boolean
  convertFromPixel: (
    finder: { gridIndex: number },
    value: number[]
  ) => number[] | number
}

/** A value axis range, in the axis' own units. */
export interface ValueRange {
  min: number
  max: number
}

/** What a finished zoom box asks the chart to show. */
export interface ZoomBox {
  time: TimeWindow
  /** The panel the box was drawn in. */
  gridIndex: number
  /** `null` when the box was too flat to mean a value range. */
  value: ValueRange | null
}

// Anything smaller is a click or a slip of the mouse, not a box.
export const MIN_ZOOM_BOX_PX = 6

/**
 * Turns a box dragged on the chart into the window to zoom to. The time range
 * comes from the box's width and applies to every panel; the value range
 * comes from its height and applies to the panel it started in. A box too
 * flat to mean a value range zooms time only. Returns `null` for a box that
 * started off every panel or is too narrow to mean anything.
 */
export const resolveZoomBox = (
  start: ChartPixel,
  end: ChartPixel,
  chart: ZoomBoxChart,
  gridCount: number
): ZoomBox | null => {
  if (Math.abs(end.x - start.x) < MIN_ZOOM_BOX_PX) return null

  let gridIndex = -1
  for (let index = 0; index < gridCount; index += 1) {
    if (chart.containPixel({ gridIndex: index }, [start.x, start.y])) {
      gridIndex = index
      break
    }
  }
  if (gridIndex < 0) return null

  const toData = (pixel: ChartPixel) => {
    const value = chart.convertFromPixel({ gridIndex }, [pixel.x, pixel.y])
    return Array.isArray(value) ? value : [Number.NaN, Number.NaN]
  }
  const [startTime, startValue] = toData(start)
  const [endTime, endValue] = toData(end)
  if (!isFiniteNumber(startTime) || !isFiniteNumber(endTime)) return null

  const isTall = Math.abs(end.y - start.y) >= MIN_ZOOM_BOX_PX
  const value =
    isTall && isFiniteNumber(startValue) && isFiniteNumber(endValue)
      ? {
          min: Math.min(startValue, endValue),
          max: Math.max(startValue, endValue),
        }
      : null

  return {
    time: {
      startValue: Math.min(startTime, endTime),
      endValue: Math.max(startTime, endTime),
    },
    gridIndex,
    value,
  }
}

/** The box being dragged, as a rectangle on the chart surface. */
export interface ZoomBoxRect {
  left: number
  top: number
  width: number
  height: number
}

const rectBetween = (a: ChartPixel, b: ChartPixel): ZoomBoxRect => ({
  left: Math.min(a.x, b.x),
  top: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x),
  height: Math.abs(b.y - a.y),
})

/**
 * Lets the user drag a zoom box on the chart while `active`. The press is
 * caught on the way down, before the chart sees it, so the drag neither pans
 * nor paints over the brushed selection; the wheel is left alone so Shift+wheel
 * keeps zooming. Returns the box to draw while the drag is under way.
 */
export const useZoomBoxDrag = (
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onComplete: (start: ChartPixel, end: ChartPixel) => void
) => {
  const [rect, setRect] = useState<ZoomBoxRect | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const container = ref.current
    if (!container || !active) return

    let origin: ChartPixel | null = null
    const toPixel = (event: MouseEvent): ChartPixel => {
      const bounds = container.getBoundingClientRect()
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    }

    const handleMove = (event: MouseEvent) => {
      if (origin) setRect(rectBetween(origin, toPixel(event)))
    }
    const handleUp = (event: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      const start = origin
      origin = null
      setRect(null)
      if (start) onCompleteRef.current(start, toPixel(event))
    }
    const handleDown = (event: MouseEvent) => {
      if (event.button !== 0) return
      origin = toPixel(event)
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    }
    // zrender listens for pointer or mouse events depending on the browser;
    // keeping both presses from it stops the inside zoom starting a pan, and
    // keeping the click stops a box that ends on a point from picking it.
    const keepFromChart = (event: Event) => event.stopPropagation()
    const keptEvents = ['pointerdown', 'mousedown', 'click']

    for (const name of keptEvents) {
      container.addEventListener(name, keepFromChart, { capture: true })
    }
    container.addEventListener('mousedown', handleDown, { capture: true })
    return () => {
      for (const name of keptEvents) {
        container.removeEventListener(name, keepFromChart, { capture: true })
      }
      container.removeEventListener('mousedown', handleDown, { capture: true })
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      setRect(null)
    }
  }, [active, ref])

  return rect
}

const findScrollParent = (element: HTMLElement | null): HTMLElement | null => {
  let current = element?.parentElement ?? null
  while (current) {
    const { overflowY } = getComputedStyle(current)
    if (overflowY === 'auto' || overflowY === 'scroll') return current
    current = current.parentElement
  }
  return null
}

/**
 * Visible height of whatever scrolls `ref`'s element — the app shell's
 * content pane, or the window when nothing closer scrolls. Pinned panels are
 * capped to it so their bottom never hangs past the edge of the screen,
 * whatever banners the shell is showing above.
 */
export const useScrollportHeight = (ref: RefObject<HTMLElement | null>) => {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const scrollParent = findScrollParent(ref.current)

    if (!scrollParent || typeof ResizeObserver === 'undefined') {
      const measureWindow = () => setHeight(window.innerHeight)
      measureWindow()
      window.addEventListener('resize', measureWindow)
      return () => window.removeEventListener('resize', measureWindow)
    }

    const measure = () => setHeight(scrollParent.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scrollParent)
    return () => observer.disconnect()
  }, [ref])

  return height
}
