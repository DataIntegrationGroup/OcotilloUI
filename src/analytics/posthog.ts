import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
const appEnv = import.meta.env.VITE_APP_ENV || 'production'

// PostHog runs on any deployment that has a key (staging + production).
// Local dev has no key, so it is never enabled.
const isEnabled = Boolean(posthogKey)

let initialized = false

export const initPostHog = () => {
  if (!isEnabled || initialized) return

  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
  })

  // Tag every event with the environment so staging visits are
  // distinguishable from production in the PostHog dashboard.
  posthog.register({ environment: appEnv })

  initialized = true
}

export const capturePostHogPageview = (path: string) => {
  if (!isEnabled || !initialized) return

  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
  })
}

export const identifyUser = (
  userId: string,
  properties: { name?: string; email?: string }
) => {
  if (!isEnabled || !initialized) return
  posthog.identify(userId, properties)
}

export const captureEvent = (
  event: string,
  properties?: Record<string, unknown>
) => {
  if (!isEnabled || !initialized) return
  posthog.capture(event, properties)
}

export const resetUser = () => {
  if (!isEnabled || !initialized) return
  posthog.reset()
}

