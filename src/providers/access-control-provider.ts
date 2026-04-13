import { getAccessControlGroups } from '@/providers/authentik-provider'
import { canAccessResource } from '@/utils'

type Actions = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'manage'

type AccessControlCanParams = {
  resource: string
  action: Actions
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

    return {
      can: canAccessResource({ groups, resource, action, isWip }),
    }
  },
}
