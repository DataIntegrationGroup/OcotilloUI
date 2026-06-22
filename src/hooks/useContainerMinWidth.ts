import * as React from 'react'

/**
 * Returns true when the observed element's content width is at least minWidth.
 * Uses ResizeObserver so layout responds to available space (e.g. when side panels open).
 */
export function useContainerMinWidth(
  ref: React.RefObject<Element | null>,
  minWidth: number
) {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = (width: number) => {
      setMatches(width >= minWidth)
    }

    update(element.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(entry.contentRect.width)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [minWidth, ref])

  return matches
}
