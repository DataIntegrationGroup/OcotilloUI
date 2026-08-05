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
