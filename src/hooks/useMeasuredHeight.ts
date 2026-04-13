import { useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'

export const useMeasuredHeight = <T extends HTMLElement>(
  dependencies: DependencyList,
  initialHeight = 0
) => {
  const ref = useRef<T | null>(null)
  const [height, setHeight] = useState(initialHeight)

  useEffect(() => {
    if (!ref.current) return

    const updateHeight = () => {
      if (!ref.current) return
      setHeight(ref.current.offsetHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(() => updateHeight())
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, dependencies)

  return { ref, height }
}
