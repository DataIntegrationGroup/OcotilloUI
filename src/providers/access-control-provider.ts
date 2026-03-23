import { getAccessControlGroups } from '@/providers/authentik-provider'
import { canAccessResource } from '@/utils'
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  MongoAbility,
} from '@casl/ability'

type Actions = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'manage'
type Subjects = 'all' | string // keep string since resources are dynamic strings

type AppAbility = MongoAbility<[Actions, Subjects]>

const defineUserAbility = (groups: string[] | null): AppAbility => {
  const { build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  return build({
    detectSubjectType: (subject) => subject as ExtractSubjectType<Subjects>,
  })
}

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
    defineUserAbility(groups)

    const isWip =
      Boolean(
        (params as { resource?: { meta?: { wip?: boolean } } } | undefined)
          ?.resource?.meta?.wip
      )

    return {
      can: canAccessResource({ groups, resource, action, isWip }),
    }
  },
}
