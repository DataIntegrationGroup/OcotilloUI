import { useEffect, useState, type RefObject } from 'react'

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
 * page. Ctrl is also what a trackpad pinch reports, so pinch-to-zoom keeps
 * working without a modifier.
 */
export const isChartZoomWheel = (event: Pick<WheelEvent, 'ctrlKey'>) =>
  event.ctrlKey

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
