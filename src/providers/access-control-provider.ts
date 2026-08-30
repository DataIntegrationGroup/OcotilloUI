import { getAccessControlGroups } from '@/providers/authentik-provider'
import { canAccessResource } from '@/utils'
import { isGrantableAction, isUiSurfaceGranted } from '@/utils/uiSurfaceGrants'

type Actions = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'manage'

type AccessControlCanParams = {
  resource?: string
  action: string
  params?: unknown
}

type AccessControlCanResult = { can: boolean }

export const accessControlProvider = {
  can: async ({
    resource,
    action,
    params,
  }: AccessControlCanParams): Promise<AccessControlCanResult> => {
    const groups = getAccessControlGroups()

    const isWip = Boolean(
      (params as { resource?: { meta?: { wip?: boolean } } } | undefined)
        ?.resource?.meta?.wip
    )

    const allowedByRole = canAccessResource({
      groups,
      resource: resource ?? '',
      action: action as Actions,
      isWip,
    })

    // The role policy is the floor, and grants only ever raise it. Asking
    // first means the common case costs nothing, and it means a grants
    // outage cannot take a screen away from someone whose role allows it.
    if (allowedByRole) return { can: true }

    // A WIP surface is hidden because it is not finished, not because of who
    // is asking. No grant should reveal it.
    if (isWip || !resource) return { can: false }

    if (!isGrantableAction(action)) return { can: false }

    return { can: await isUiSurfaceGranted(resource) }
  },
}
