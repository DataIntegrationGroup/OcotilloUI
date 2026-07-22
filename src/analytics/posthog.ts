import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
const appEnv = import.meta.env.VITE_APP_ENV || 'production'
const appVersion = import.meta.env.VITE_APP_VERSION || 'unknown'

/** Canonical production app host (matches GAE production deploy). */
export const PRODUCTION_HOSTNAME = 'ocotillo.newmexicowaterdata.org'

// PostHog runs on any deployment that has a key (staging + production).
// Local dev has no key, so it is never enabled.
const isEnabled = Boolean(posthogKey)

let initialized = false

/** True on the live production site only (not staging, previews, or local). */
export const isProductionDeployment = (): boolean => {
  if (appEnv !== 'production') return false
  if (typeof window === 'undefined') return false
  return window.location.hostname === PRODUCTION_HOSTNAME
}

/** Session replay is production-only and starts after the user is identified. */
export const shouldRecordSessions = (): boolean => isProductionDeployment()

const sessionRecordingConfig = {
  maskInputFn: (text: string, element?: Element | null) => {
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
}

export const initPostHog = () => {
  if (!isEnabled || initialized) return

  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
    // Disabled at init; started manually after identify so recordings are
    // always tied to an authenticated person, and only on production.
    disable_session_recording: true,
    ...(shouldRecordSessions() ? { session_recording: sessionRecordingConfig } : {}),
  })

  // Tag every event with deployment context so dashboards can filter
  // staging, production, and preview traffic separately.
  posthog.register({
    environment: appEnv,
    app_version: appVersion,
    ...(typeof window !== 'undefined'
      ? { deployment_host: window.location.hostname }
      : {}),
  })

  initialized = true
}

export const WELLS_PROJECT_FILTER_SOURCE_KEY = 'wells_project_filter_source'

export type WellsProjectFilterSource =
  | 'projects_list'
  | 'wells_column'
  | 'project_show'
  | 'well_detail'
  | 'direct'

export const setWellsProjectFilterSource = (source: WellsProjectFilterSource) => {
  sessionStorage.setItem(WELLS_PROJECT_FILTER_SOURCE_KEY, source)
}

export const consumeWellsProjectFilterSource = (): WellsProjectFilterSource => {
  const value = sessionStorage.getItem(WELLS_PROJECT_FILTER_SOURCE_KEY)
  sessionStorage.removeItem(WELLS_PROJECT_FILTER_SOURCE_KEY)
  if (
    value === 'projects_list' ||
    value === 'wells_column' ||
    value === 'project_show' ||
    value === 'well_detail'
  ) {
    return value
  }
  return 'direct'
}

export const trackNavItemClicked = (props: {
  label: string
  href: string
  resource?: string
  parent_label?: string
}) => {
  captureEvent('nav_item_clicked', props)
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

/**
 * Extra `$pageview` properties for list pages (Projects, filtered Wells, etc.).
 */
export const listPageviewProps = (
  pathname: string,
  search: string
): Record<string, unknown> | undefined => {
  if (pathname === '/ocotillo/well/projects') {
    return { page_template: 'projects_list' }
  }

  if (pathname === '/ocotillo/well') {
    const projectId = new URLSearchParams(
      search.startsWith('?') ? search.slice(1) : search
    ).get('projectId')
    if (projectId) {
      return {
        page_template: 'wells_list',
        wells_view: 'project_filtered',
        project_id: projectId,
      }
    }
    return { page_template: 'wells_list' }
  }

  if (pathname === '/ocotillo/contact') {
    return { page_template: 'contacts_list' }
  }

  return undefined
}

export const pageviewExtras = (
  pathname: string,
  search: string
): Record<string, unknown> | undefined =>
  wellDetailPageviewProps(pathname) ?? listPageviewProps(pathname, search)

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

  const personProps: Record<string, string | undefined> = {
    name: properties.name,
    email: properties.email,
  }
  // $email is the PostHog reserved property that surfaces in the person list.
  if (properties.email) {
    personProps.$email = properties.email
  }

  posthog.identify(userId, personProps)
}

/** Call after identify on production so replay is tied to the authenticated person. */
export const startSessionRecordingIfEligible = () => {
  if (!isEnabled || !initialized || !shouldRecordSessions()) return
  posthog.startSessionRecording()
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
