import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
const isEnabled = Boolean(posthogKey)

let initialized = false

export const initPostHog = () => {
  if (!isEnabled || initialized) return

  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
  })

  initialized = true
}

export const capturePostHogPageview = (path: string) => {
  if (!isEnabled || !initialized) return

  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
  })
}

