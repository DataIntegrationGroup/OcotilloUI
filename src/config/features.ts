const TRUTHY = ['1', 'true', 'yes', 'on']
const FALSY = ['0', 'false', 'no', 'off']

/** Reads a tri-state env flag: on, off, or unset (fall back to the default). */
const envFlag = (value: unknown): boolean | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (TRUTHY.includes(normalized)) return true
  if (FALSY.includes(normalized)) return false
  return undefined
}

/**
 * Desktop GIS downloads on the datasets page: the per-dataset download links,
 * the "Desktop GIS" table column, and the connections panel.
 *
 * The v1.2.1 hotfix pulled the whole datasets page back to its pre-v1.2.0
 * state, taking the table view and these downloads with it. The table view
 * comes back unconditionally; the downloads stay dark in production until the
 * artifact catalogue is signed off. Local dev and preview/staging deploys get
 * them by default so reviewers can exercise the feature — the same rule as
 * SHOW_EXAMPLE_NAV in src/config/navigation.ts.
 *
 * VITE_ENABLE_GIS_DOWNLOADS overrides that default in either direction, so
 * production can turn them on without a code change and staging can turn them
 * off for a demo.
 */
export const SHOW_GIS_DOWNLOADS =
  envFlag(import.meta.env.VITE_ENABLE_GIS_DOWNLOADS) ??
  (import.meta.env.DEV ||
    ['preview', 'staging'].includes(import.meta.env.VITE_APP_ENV))
