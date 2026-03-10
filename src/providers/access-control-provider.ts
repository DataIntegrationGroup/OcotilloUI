import { getAccessControlGroups } from '@/providers/authentik-provider'
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  MongoAbility,
} from '@casl/ability'

type Actions = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'manage'
type Subjects = 'all' | string // keep string since resources are dynamic strings

type AppAbility = MongoAbility<[Actions, Subjects]>

type Can = AbilityBuilder<AppAbility>['can']
type Cannot = AbilityBuilder<AppAbility>['cannot']

const viewer = (can: Can, cannot: Cannot, resource: string) => {
  can('list', resource)
  can('show', resource)

  cannot('edit', resource)
  cannot('create', resource)
  cannot('delete', resource)
}

const editor = (can: Can, cannot: Cannot, resource: string) => {
  can('list', resource)
  can('show', resource)
  can('edit', resource)
  cannot('create', resource)
  cannot('delete', resource)
}

const defineUserAbility = (groups: string[] | null): AppAbility => {
  const safeGroups = groups ?? []

  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createMongoAbility
  )

  const resources = [
    'ocotillo.sensor',
    'ocotillo.group',
    'ocotillo.location',
    'ocotillo.sample',
    'ocotillo.asset',
    'ocotillo.contact',
  ]

  if (safeGroups.includes('Viewer')) {
    can('list', 'ocotillo')
    can('list', 'ocotillo.map')
    can('list', 'ocotillo.lexicon')

    resources.forEach((resource) => {
      viewer(can, cannot, resource)
    })
  }
  if (safeGroups.includes('Editor')) {
    resources.forEach((resource) => {
      editor(can, cannot, resource)
    })
  }

  if (safeGroups.includes('AMPViewer')) {
    viewer(can, cannot, 'ocotillo.observation')
    viewer(can, cannot, 'ocotillo.thing-well')
    viewer(can, cannot, 'ocotillo.thing-spring')
    viewer(can, cannot, 'ocotillo.groundwater-level-observation')
    viewer(can, cannot, 'ocotillo.thing-well-batch-export')
  }

  if (safeGroups.includes('AMPEditor')) {
    can('list', 'ocotillo.tables')
    can('list', 'ocotillo.thing')

    can('list', 'ocotillo.forms')
    can('list', 'ocotillo.well-inventory-form')
    can('list', 'ocotillo.groundwater-level-form')

    can('list', 'ocotillo.apps')
    can('list', 'ocotillo.water-chemistry-import')
    can('list', 'ocotillo.hydrograph-corrector')
    can('list', 'ocotillo.thing-well-batch-export')
  }

  if (safeGroups.includes('LexiconEditor')) {
    editor(can, cannot, 'ocotillo.lexicon/term')
    editor(can, cannot, 'ocotillo.lexicon/category')
  }

  if (safeGroups.includes('LexiconAdmin')) {
    can('manage', 'ocotillo.lexicon/term')
    can('manage', 'ocotillo.lexicon/category')
  }

  if (safeGroups.includes('OcotilloAdmin')) {
    can('manage', 'all')
  }

  if (!safeGroups.includes('OcotilloAdmin')) {
    cannot('create', 'all')
    cannot('edit', 'all')
    cannot('delete', 'all')
  }

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
  }: AccessControlCanParams): Promise<AccessControlCanResult> => {
    const groups = getAccessControlGroups()

    const ability = defineUserAbility(groups)
    return { can: ability.can(action, resource) }
  },
}
