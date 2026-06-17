import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import {
  capturePostHogPageview,
  initPostHog,
  pageviewExtras,
} from '@/analytics/posthog'

export const PostHogPageview = () => {
  const location = useLocation()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    initPostHog()
  }, [])

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`

    if (lastPathRef.current === path) return

    const extras = pageviewExtras(location.pathname, location.search)
    capturePostHogPageview(path, extras)
    lastPathRef.current = path
  }, [location.hash, location.pathname, location.search])

  return null
}

