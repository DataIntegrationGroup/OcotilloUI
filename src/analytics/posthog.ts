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
    // Runtime accepts false to skip survey UI and extra scripts; generated types model `surveys` as SurveyConfig only.
    // @ts-expect-error Survey toggle still supported at runtime
    surveys: false,
  })

  // Tag every event with the environment so staging visits are
  // distinguishable from production in the PostHog dashboard.
  posthog.register({ environment: appEnv })

  initialized = true
}

export const capturePostHogPageview = (path: string) => {
  initPostHog()
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
  initPostHog()
  if (!isEnabled || !initialized) return
  posthog.identify(userId, properties)
}

export const captureEvent = (
  event: string,
  properties?: Record<string, unknown>
) => {
  initPostHog()
  if (!isEnabled || !initialized) return
  posthog.capture(event, properties)
}

export const resetUser = () => {
  initPostHog()
  if (!isEnabled || !initialized) return
  posthog.reset()
}

