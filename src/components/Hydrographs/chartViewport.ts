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
