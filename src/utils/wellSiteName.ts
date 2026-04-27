import type { IWell } from '@/interfaces/ocotillo'

/**
 * Site name shown in lists and exports: uses API `site_name` when set, otherwise
 * the same rule as OcotilloAPI `Thing.site_name` (lowest id among NMBGMR links).
 */
export function displayWellSiteName(
  well: Pick<IWell, 'site_name' | 'alternate_ids'>
): string {
  const fromApi = well.site_name?.trim()
  if (fromApi) return fromApi

  const links = [...(well.alternate_ids ?? [])].sort((a, b) => a.id - b.id)
  const nmbgmr = links.find(
    (link) => link.alternate_organization?.toUpperCase() === 'NMBGMR'
  )
  return nmbgmr?.alternate_id ?? ''
}
