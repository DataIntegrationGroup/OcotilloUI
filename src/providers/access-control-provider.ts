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
      'ocotillo.sensor',
      'ocotillo.lexicon',
      'ocotillo.group',
      'ocotillo.location',
      'ocotillo.sample',
      'ocotillo.asset',
      'ocotillo.contact',
    ]
    if (groups.includes('Viewer')) {
      can('list', 'ocotillo')
      can('list', 'ocotillo.thing')
      can('list', 'ocotillo.map')

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
      viewer(can, cannot, 'ocotillo.observation')
      viewer(can, cannot, 'ocotillo.thing-well')
      viewer(can, cannot, 'ocotillo.thing-spring')
      viewer(can, cannot, 'ocotillo.groundwater-level-observation')
    }
    if (groups.includes('AMPEditor')) {
      can('list', 'ocotillo.forms')
      can('list', 'ocotillo.well-inventory-form')
      can('list', 'ocotillo.groundwater-level-form')

      can('list', 'ocotillo.apps')
      can('list', 'ocotillo.water-chemistry-import')
      can('list', 'ocotillo.hydrograph-corrector')
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
