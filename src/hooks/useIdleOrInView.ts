import { useCallback, useEffect, useState } from 'react'

type Options = {
  /** passed to IntersectionObserver */
  rootMargin?: string
  /** max wait before idle callback fires (requestIdleCallback timeout) */
  idleTimeoutMs?: number
}

/**
 * True once the sentinel intersects the viewport (with margin) or the browser
 * is idle within idleTimeoutMs, whichever comes first. Used to defer heavy UI
 * below the fold on well show.
 */
export function useIdleOrInView(options?: Options) {
  const rootMargin = options?.rootMargin ?? '320px 0px 240px 0px'
  const idleTimeoutMs = options?.idleTimeoutMs ?? 2000
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  const setSentinelRef = useCallback((el: HTMLDivElement | null) => {
    setNode(el)
  }, [])

  useEffect(() => {
    if (ready) return

    let idleHandle: number | ReturnType<typeof setTimeout>
    if (typeof requestIdleCallback !== 'undefined') {
      idleHandle = requestIdleCallback(() => setReady(true), {
        timeout: idleTimeoutMs,
      })
    } else {
      idleHandle = setTimeout(() => setReady(true), idleTimeoutMs)
    }

    const cancelIdle = () => {
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(idleHandle as number)
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>)
      }
    }

    if (!node) {
      return () => cancelIdle()
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true)
        }
      },
      { rootMargin, threshold: 0.01 }
    )
    io.observe(node)
    return () => {
      cancelIdle()
      io.disconnect()
    }
  }, [ready, node, rootMargin, idleTimeoutMs])

  return { setSentinelRef, ready }
}
