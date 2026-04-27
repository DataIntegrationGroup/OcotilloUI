import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { capturePostHogPageview, initPostHog } from '@/analytics/posthog'

export const PostHogPageview = () => {
  const location = useLocation()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    let idleHandle: number | ReturnType<typeof setTimeout>
    if (typeof requestIdleCallback !== 'undefined') {
      idleHandle = requestIdleCallback(() => initPostHog(), {
        timeout: 1500,
      })
    } else {
      idleHandle = setTimeout(() => initPostHog(), 0)
    }
    return () => {
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(idleHandle as number)
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>)
      }
    }
  }, [])

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`

    if (lastPathRef.current === path) return

    capturePostHogPageview(path)
    lastPathRef.current = path
  }, [location.hash, location.pathname, location.search])

  return null
}

