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
    session_recording: {
      maskInputFn: (text, element) => {
        const el = element as HTMLInputElement | undefined
        if (el?.type === 'password') {
          return '*'.repeat(text.length)
        }
        // ph-no-mask is PostHog's standard class for opting inputs out of masking.
        // Check the element and its ancestors so the class can be set on a wrapper.
        if (
          el?.classList?.contains('ph-no-mask') ||
          el?.closest?.('.ph-no-mask')
        ) {
          return text
        }
        return '*'.repeat(text.length)
      },
    },
  })

  // Tag every event with the environment so staging visits are
  // distinguishable from production in the PostHog dashboard.
  posthog.register({ environment: appEnv })

  initialized = true
}

/**
 * Optional properties for well detail pages so `well_id` is on `$pageview`
 * (and shows up in PostHog when breaking down or filtering).
 */
export const wellDetailPageviewProps = (
  pathname: string
):
  | {
      well_id: string
      page_template: 'well_detail'
      well_detail_area: 'ocotillo' | 'amp'
    }
  | undefined => {
  const ocotillo = pathname.match(/^\/ocotillo\/well\/show\/([^/]+)\/?$/)
  if (ocotillo) {
    return {
      well_id: ocotillo[1],
      page_template: 'well_detail',
      well_detail_area: 'ocotillo',
    }
  }
  const amp = pathname.match(/^\/amp\/wells\/show\/([^/]+)\/?$/)
  if (amp) {
    return {
      well_id: amp[1],
      page_template: 'well_detail',
      well_detail_area: 'amp',
    }
  }
  return undefined
}

export const capturePostHogPageview = (
  path: string,
  extras?: Record<string, unknown>
) => {
  if (!isEnabled || !initialized) return

  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
    ...(extras ?? {}),
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

export const setPersonProperties = (
  properties: Record<string, unknown>
) => {
  if (!isEnabled || !initialized) return
  posthog.setPersonProperties(properties)
}

/**
 * Reads browser-level accessibility and display preferences once per
 * session and returns them as PostHog person properties. Called after
 * the user is identified so the values are attached to the person record.
 */
export const getAccessibilityProps = (): Record<string, unknown> => {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return {
    browser_font_size_px: rootFontSize,
    font_size_increased: rootFontSize > 16,
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    prefers_reduced_motion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefers_high_contrast: window.matchMedia('(prefers-contrast: more)').matches,
  }
}

