/** Public web app origin used for deep links in exports (defaults to production). */
export function getOcotilloPublicAppOrigin(): string {
  const raw = import.meta.env.VITE_OCOTILLO_PUBLIC_APP_URL as string | undefined
  const trimmed = raw?.trim().replace(/\/$/, '')
  return trimmed || 'https://ocotillo.newmexicowaterdata.org'
}

/** In-app route to a well detail page. */
export function buildWellShowPath(thingId: string | number): string {
  return `/ocotillo/well/show/${thingId}`
}

/** Canonical Ocotillo well detail URL for field workflows (production unless overridden). */
export function buildWellShowAbsoluteUrl(thingId: string | number): string {
  return `${getOcotilloPublicAppOrigin()}${buildWellShowPath(thingId)}`
}

/** Public Weaver origin (defaults to production). */
export function getWeaverPublicAppOrigin(): string {
  const raw = import.meta.env.VITE_WEAVER_PUBLIC_APP_URL as string | undefined
  const trimmed = raw?.trim().replace(/\/$/, '')
  return trimmed || 'https://weaver.newmexicowaterdata.org'
}

/**
 * Weaver location page for a well, keyed by its point id (`well.name`, e.g.
 * "WL-0260"). Returns null when the well has no point id, since a Weaver link
 * without one would 404.
 */
export function buildWeaverLocationUrl(
  pointId: string | null | undefined
): string | null {
  const trimmed = pointId?.trim()
  if (!trimmed) return null
  return `${getWeaverPublicAppOrigin()}/location/${encodeURIComponent(trimmed)}`
}
