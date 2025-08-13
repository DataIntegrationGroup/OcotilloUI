import { getAccessControlGroups } from '@/providers/authentik-provider'
import { defineAbility } from '@casl/ability'

const viewer = (can: any, cannot, resource: string) => {
  can('list', resource)
  can('show', resource)

  cannot('edit', resource)
  cannot('create', resource)
  cannot('delete', resource)
}

const editor = (can: any, cannot, resource: string) => {
  can('list', resource)
  can('show', resource)
  can('edit', resource)
  cannot('create', resource)
  cannot('delete', resource)
}

const defineUserAbility = (groups: string[]) => {
  return defineAbility((can, cannot) => {
    const resources = [
      'dataforge.sensor',
      'dataforge.lexicon',
      'dataforge.group',
      'dataforge.location',
      'dataforge.sample',
      'dataforge.asset',
      'dataforge.contact',
    ]
    if (groups.includes('Viewer')) {
      can('list', 'dataforge')
      can('list', 'dataforge.thing')
      can('list', 'dataforge.map')

      resources.forEach((resource) => {
        viewer(can, cannot, resource)
      })
    }
    if (groups.includes('Editor')) {
      resources.forEach((resource) => {
        editor(can, cannot, resource)
      })
    }

    if (groups.includes('AMPViewer')) {
      viewer(can, cannot, 'dataforge.observation')
      viewer(can, cannot, 'dataforge.thing-well')
      viewer(can, cannot, 'dataforge.thing-spring')
      viewer(can, cannot, 'dataforge.groundwater-level-observation')
    }
    if (groups.includes('AMPEditor')) {
      can('list', 'dataforge.forms')
      can('list', 'dataforge.well-inventory-form')
      can('list', 'dataforge.groundwater-level-form')

      can('list', 'dataforge.apps')
      can('list', 'dataforge.water-chemistry-import')
      can('list', 'dataforge.hydrograph-corrector')
    }

    if (groups.includes('Admin')) {
      can('manage', 'all')
    }
  })
}

export const accessControlProvider = {
  can: async ({ resource, action, params }) => {
    const groups = getAccessControlGroups()

    const ability = defineUserAbility(groups)
    const can = ability.can(action, resource)
    return { can }
  },
}
