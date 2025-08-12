import { getAccessControlGroups } from '@/providers/authentik-provider'

export const accessControlProvider = {
  can: async ({ resource, action, params }) => {
    const groups = getAccessControlGroups()
    console.log(resource, action, groups)
    let can = true
    if (resource.startsWith('dataforge.')) {
      if (resource === 'dataforge.well-inventory-form') {
        can = groups.includes('LocationEditor')
      } else if (resource === 'dataforge.groundwater-level-form') {
        can = groups.includes('LocationEditor')
      } else if (resource === 'dataforge.location') {
        can = groups.includes('LocationViewer')
        if (action === 'create') {
          can = groups.includes('LocationEditor')
        } else if (action === 'edit') {
          can = groups.includes('LocationEditor')
        }
      }
    }

    return { can }
  },
}
