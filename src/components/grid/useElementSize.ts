import { useEffect, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Observe an element's content-box size via ResizeObserver.
 *
 * Returns a callback ref and the current size. The callback ref fires the
 * moment the element mounts — including when it mounts inside a portal that
 * renders later than the calling component — so the observer always attaches.
 */
export function useElementSize(): [
  (el: HTMLDivElement | null) => void,
  ElementSize,
] {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [el])

  return [setEl, size]
}
