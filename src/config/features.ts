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
 * state, taking the table view and these downloads with it. The table view is
 * back; the downloads stay dark everywhere — including local dev and
 * preview/staging — until the artifact catalogue is signed off, so no reviewer
 * or demo audience is shown a surface that is not ready.
 *
 * Set VITE_ENABLE_GIS_DOWNLOADS to turn them on for a given deploy. That is
 * the only way they appear, so enabling them later needs an env change, not a
 * code change.
 */
export const SHOW_GIS_DOWNLOADS =
  envFlag(import.meta.env.VITE_ENABLE_GIS_DOWNLOADS) ?? false

/**
 * Whether a surface still gated on the `AMP.Staging` group is offered to a user
 * who does not hold it. True in local dev (vite dev server / vitest) and on PR
 * preview deploys (VITE_APP_ENV=preview, set by the preview workflow), so a
 * reviewer can exercise work that is still under review — the preview deploy is
 * the sandbox for exactly that. Staging and production builds set neither, so
 * the group gate stays enforced where it matters.
 *
 * Without this a reviewer who is not in the group sees no sign the feature
 * exists, which reads as a broken deploy rather than a gated one.
 */
export const BYPASS_AMP_STAGING_GATE =
  import.meta.env.DEV === true || import.meta.env.VITE_APP_ENV === 'preview'
