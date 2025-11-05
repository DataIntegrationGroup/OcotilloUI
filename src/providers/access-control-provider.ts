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
      'ocotillo.group',
      'ocotillo.location',
      'ocotillo.sample',
      'ocotillo.asset',
      'ocotillo.contact',
    ]

    if (groups.includes('Viewer')) {
      can('list', 'ocotillo')
      can('list', 'ocotillo.map')
      can('list', 'ocotillo.lexicon')

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
      can('list', 'ocotillo.tables')
      can('list', 'ocotillo.thing')

      can('list', 'ocotillo.forms')
      can('list', 'ocotillo.well-inventory-form')
      can('list', 'ocotillo.groundwater-level-form')

      can('list', 'ocotillo.apps')
      can('list', 'ocotillo.water-chemistry-import')
      can('list', 'ocotillo.hydrograph-corrector')
    }

    if (groups.includes('LexiconEditor')) {
      editor(can, cannot, 'ocotillo.lexicon/term')
      editor(can, cannot, 'ocotillo.lexicon/category')
    }

    if (groups.includes('LexiconAdmin')) {
      can('manage', 'ocotillo.lexicon/term')
      can('manage', 'ocotillo.lexicon/category')
    }

    if (groups.includes('OcotilloAdmin')) {
      can('manage', 'all')
    }


  })
}

export const accessControlProvider = {
  can: async ({ resource, action, params }) => {
    const groups = getAccessControlGroups()

    // Require new EarlyAccessAdmin group for Create/Edit/Delete operations
    if ((action === 'create' || action === 'edit' || action === 'delete') && !groups.includes('EarlyAccessAdmin')) {
      return { can: false }
    }

    const ability = defineUserAbility(groups)
    const can = ability.can(action, resource)
    return { can }
  },
}
