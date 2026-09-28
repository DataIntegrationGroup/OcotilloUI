import type { DeploymentLike } from '@/utils/SensorDeploymentRows'

const toDateKey = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : null

/**
 * The deployments whose installation period covers a block's span.
 *
 * Mirrors the API's `resolve_deployment_id` (OcotilloAPI
 * domain/hydrograph.py) so the page can tell before publishing whether the
 * server would have to guess. A missing installation date reads as "always
 * installed" and a missing removal date as "still installed", compared by
 * UTC calendar date as the API does. When more than one deployment covers the
 * span the API refuses to pick, so the user has to.
 */
export const findCoveringDeployments = <T extends DeploymentLike>(
  deployments: readonly T[],
  spanStart: Date,
  spanEnd: Date
): T[] => {
  const startKey = spanStart.toISOString().slice(0, 10)
  const endKey = spanEnd.toISOString().slice(0, 10)

  return deployments.filter((deployment) => {
    if (typeof deployment.id !== 'number') return false
    const installed = toDateKey(deployment.installation_date)
    const removed = toDateKey(deployment.removal_date)
    return (
      (installed === null || installed <= startKey) &&
      (removed === null || removed >= endKey)
    )
  })
}
