import type {
  IAddress,
  IContact,
  IEmail,
  IPhone,
} from '@/interfaces/ocotillo/IContact'

export type AmpRole = 'AMP.Viewer' | 'AMP.Editor' | 'AMP.Admin'
export type GeothermalRole =
  | 'Geothermal.Viewer'
  | 'Geothermal.Editor'
  | 'Geothermal.Admin'
export type PortalRole = AmpRole | GeothermalRole

const roleOrder: PortalRole[] = [
  'AMP.Viewer',
  'AMP.Editor',
  'AMP.Admin',
  'Geothermal.Viewer',
  'Geothermal.Editor',
  'Geothermal.Admin',
]

export const wipResources = new Set([
  'water.dashboard',
  'water.reportbuilder',
  'water.querybuilder',
  'water.waterlevelform',
  'water.projects',
  'water.wells',
  'water.equipment',
  'water.manual_waterlevels',
  'water.chemupload',
  'water.manualwaterlevels_batchupload',
])

type Action = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'manage'

type ResourcePolicy = Partial<Record<Action, PortalRole[]>>

const viewerRoles: PortalRole[] = ['AMP.Viewer', 'AMP.Editor', 'AMP.Admin']
const editorRoles: PortalRole[] = ['AMP.Editor', 'AMP.Admin']
const adminRoles: PortalRole[] = ['AMP.Admin']
const geothermalViewerRoles: PortalRole[] = [
  'Geothermal.Viewer',
  'Geothermal.Editor',
  'Geothermal.Admin',
]
const geothermalEditorRoles: PortalRole[] = [
  'Geothermal.Editor',
  'Geothermal.Admin',
]
const geothermalAdminRoles: PortalRole[] = ['Geothermal.Admin']
const adminOnlyRoles = new Set<PortalRole>(['AMP.Admin', 'Geothermal.Admin'])

const resourcePolicies: Record<string, ResourcePolicy> = {
  ocotillo: { list: viewerRoles, show: viewerRoles },
  'ocotillo.map': { list: viewerRoles, show: viewerRoles },
  'ocotillo.collections': { list: viewerRoles, show: viewerRoles },
  'ocotillo.contact': {
    list: viewerRoles,
    show: viewerRoles,
    edit: editorRoles,
    create: editorRoles,
    delete: editorRoles,
    manage: editorRoles,
  },
  'ocotillo.location': {
    list: ['AMP.Admin', 'Geothermal.Admin'],
    show: ['AMP.Admin', 'Geothermal.Admin'],
    edit: ['AMP.Admin', 'Geothermal.Admin'],
    create: ['AMP.Admin', 'Geothermal.Admin'],
    delete: ['AMP.Admin', 'Geothermal.Admin'],
    manage: ['AMP.Admin', 'Geothermal.Admin'],
  },
  'ocotillo.lexicon': {
    list: adminRoles,
    show: adminRoles,
    edit: editorRoles,
    create: adminRoles,
    delete: adminRoles,
    manage: adminRoles,
  },
  'ocotillo.thing-well': {
    list: viewerRoles,
    show: viewerRoles,
    edit: editorRoles,
    create: adminRoles,
    delete: adminRoles,
    manage: adminRoles,
  },
  // Editors correct and publish hydrographs. Deleting stored transducer
  // observations is irreversible, so it stays a tier above page access.
  'ocotillo.hydrograph-correction': {
    list: editorRoles,
    show: editorRoles,
    delete: adminRoles,
  },
  'ocotillo.thing-well-pdf-preview': { list: adminRoles, show: adminRoles },
  'ocotillo.thing-well-batch-export': { list: viewerRoles, show: viewerRoles },
  'ocotillo.thing-well-projects': { list: viewerRoles, show: viewerRoles },
  'ocotillo.asset-unassociated': {
    list: adminRoles,
    show: adminRoles,
    edit: adminRoles,
    create: adminRoles,
    delete: adminRoles,
    manage: adminRoles,
  },
  'ocotillo.groundwater-level-observation': {
    list: viewerRoles,
    show: viewerRoles,
    edit: editorRoles,
    create: adminRoles,
    delete: adminRoles,
    manage: adminRoles,
  },
  geothermal: { list: geothermalViewerRoles, show: geothermalViewerRoles },
  'water.locations': {
    list: ['AMP.Admin', 'Geothermal.Admin'],
    show: ['AMP.Admin', 'Geothermal.Admin'],
    edit: ['AMP.Admin', 'Geothermal.Admin'],
    create: ['AMP.Admin', 'Geothermal.Admin'],
    delete: ['AMP.Admin', 'Geothermal.Admin'],
    manage: ['AMP.Admin', 'Geothermal.Admin'],
  },
  'water.wellinventoryform': {
    list: editorRoles,
    show: editorRoles,
    edit: editorRoles,
    create: editorRoles,
    delete: editorRoles,
    manage: editorRoles,
  },
}

const matchesPolicy = (
  allowedRoles: PortalRole[] | undefined,
  roles: PortalRole[]
): boolean => Boolean(allowedRoles?.some((role) => roles.includes(role)))

export const isResourceListAdminOnly = (resource?: string): boolean => {
  if (!resource) return false

  const listPolicy =
    resourcePolicies[resource]?.list ??
    resourcePolicies[resource.toLowerCase()]?.list

  if (!listPolicy || listPolicy.length === 0) return false

  return listPolicy.every((role) => adminOnlyRoles.has(role))
}

export const normalizeAccessControlGroups = (
  groups: string[] | null | undefined
): PortalRole[] => {
  const normalized = new Set<PortalRole>()

  for (const group of groups ?? []) {
    if (roleOrder.includes(group as PortalRole)) {
      normalized.add(group as PortalRole)
    }
  }

  const expandedRoles = new Set<PortalRole>()
  const domainHierarchies: PortalRole[][] = [
    ['AMP.Viewer', 'AMP.Editor', 'AMP.Admin'],
    ['Geothermal.Viewer', 'Geothermal.Editor', 'Geothermal.Admin'],
  ]

  for (const hierarchy of domainHierarchies) {
    if (normalized.has(hierarchy[2])) {
      hierarchy.forEach((role) => expandedRoles.add(role))
      continue
    }
    if (normalized.has(hierarchy[1])) {
      expandedRoles.add(hierarchy[0])
      expandedRoles.add(hierarchy[1])
      continue
    }
    if (normalized.has(hierarchy[0])) {
      expandedRoles.add(hierarchy[0])
    }
  }

  return roleOrder.filter((role) => expandedRoles.has(role))
}

export const getPrimaryRole = (
  groups: string[] | null | undefined
): PortalRole | null => {
  const normalized = normalizeAccessControlGroups(groups)
  return normalized.length > 0 ? normalized[normalized.length - 1] : null
}

export const getAccessCapabilities = (groups: string[] | null | undefined) => {
  const roles = normalizeAccessControlGroups(groups)
  const primaryRole = getPrimaryRole(groups)
  const canViewAmp =
    roles.includes('AMP.Viewer') ||
    roles.includes('AMP.Editor') ||
    roles.includes('AMP.Admin')
  const canEditAmp = roles.includes('AMP.Editor') || roles.includes('AMP.Admin')
  const canManageAmp = roles.includes('AMP.Admin')
  const canViewConfidential = canEditAmp
  const canViewUnfinished = canManageAmp
  const canViewGeothermal =
    roles.includes('Geothermal.Viewer') ||
    roles.includes('Geothermal.Editor') ||
    roles.includes('Geothermal.Admin')
  const canEditGeothermal =
    roles.includes('Geothermal.Editor') || roles.includes('Geothermal.Admin')
  const canManageGeothermal = roles.includes('Geothermal.Admin')

  return {
    roles,
    primaryRole,
    canViewAmp,
    canEditAmp,
    canManageAmp,
    canViewConfidential,
    canViewUnfinished,
    canViewGeothermal,
    canEditGeothermal,
    canManageGeothermal,
    canViewLexicon: canEditAmp,
    // Change canManageAmp → canEditAmp here when editors should get well editing access.
    canEditWell: canManageAmp,
  }
}

export const canAccessResource = ({
  groups,
  resource,
  action,
  isWip = false,
}: {
  groups: string[] | null | undefined
  resource: string
  action: 'list' | 'show' | 'create' | 'edit' | 'delete' | 'manage'
  isWip?: boolean
}): boolean => {
  const capabilities = getAccessCapabilities(groups)

  if (resource === 'ocotillo.collections') {
    const policy = resourcePolicies[resource]
    return matchesPolicy(policy[action], capabilities.roles)
  }

  if (resource === 'ocotillo.lexicon') {
    const policy = resourcePolicies[resource]
    return matchesPolicy(policy[action], capabilities.roles)
  }

  if (resource === 'ocotillo.thing-well-batch-export') {
    const policy = resourcePolicies[resource]
    return matchesPolicy(policy[action], capabilities.roles)
  }

  if (resource === 'ocotillo.thing-well-projects') {
    const policy = resourcePolicies[resource]
    return matchesPolicy(policy[action], capabilities.roles)
  }

  if (
    resource === 'ocotillo.hydrograph-correction' ||
    resource === 'ocotillo.thing-well-pdf-preview'
  ) {
    const policy = resourcePolicies[resource]
    return matchesPolicy(policy[action], capabilities.roles)
  }

  if (
    resource === 'water.locations' ||
    resource === 'water.wellinventoryform'
  ) {
    const policy = resourcePolicies[resource]
    return matchesPolicy(policy[action], capabilities.roles)
  }

  if (isWip || wipResources.has(resource)) {
    return capabilities.canViewUnfinished
  }

  if (resource in resourcePolicies) {
    const policy = resourcePolicies[resource]
    return matchesPolicy(policy[action], capabilities.roles)
  }

  if (resource.startsWith('water.')) {
    return false
  }

  if (resource.startsWith('geothermal.')) {
    if (action === 'list' || action === 'show') {
      return matchesPolicy(geothermalViewerRoles, capabilities.roles)
    }
    if (action === 'edit') {
      return matchesPolicy(geothermalEditorRoles, capabilities.roles)
    }
    if (action === 'create' || action === 'delete' || action === 'manage') {
      return matchesPolicy(geothermalAdminRoles, capabilities.roles)
    }
  }

  return false
}

const isPrivateReleaseStatus = (releaseStatus?: string | null): boolean =>
  (releaseStatus ?? '').toLowerCase() === 'private'

const filterPublicOnly = <T extends { release_status?: string | null }>(
  items: T[] | undefined | null
): T[] =>
  (items ?? []).filter((item) => !isPrivateReleaseStatus(item.release_status))

const sanitizeContactMethods = <T extends { release_status?: string | null }>(
  items: T[] | undefined | null,
  canViewConfidential: boolean
): T[] | undefined => {
  if (canViewConfidential) return items ?? undefined
  const filtered = filterPublicOnly(items)
  return filtered.length > 0 ? filtered : []
}

export const sanitizeContact = (
  contact: IContact,
  canViewConfidential: boolean
): IContact => {
  if (canViewConfidential) return contact

  const contactIsPrivate = isPrivateReleaseStatus(contact.release_status)

  return {
    ...contact,
    name: contactIsPrivate ? 'Confidential Contact' : contact.name,
    organization: contactIsPrivate ? undefined : contact.organization,
    role: contactIsPrivate ? '' : (contact.role ?? ''),
    contact_type: contactIsPrivate ? undefined : contact.contact_type,
    emails: sanitizeContactMethods(contact.emails, false) as
      | IEmail[]
      | undefined,
    phones: sanitizeContactMethods(contact.phones, false) as
      | IPhone[]
      | undefined,
    addresses: sanitizeContactMethods(contact.addresses, false) as
      | IAddress[]
      | undefined,
  }
}

export const sanitizeContacts = (
  contacts: readonly IContact[] | undefined | null,
  canViewConfidential: boolean
): IContact[] =>
  (contacts ?? []).map((contact) =>
    sanitizeContact(contact, canViewConfidential)
  )

export const filterConfidentialRows = <
  T extends { release_status?: string | null },
>(
  rows: T[] | undefined | null,
  canViewConfidential: boolean
): T[] => (canViewConfidential ? (rows ?? []) : filterPublicOnly(rows))

export const highestRoleLabel = (
  groups: string[] | null | undefined
): string | null => {
  const role = getPrimaryRole(groups)
  if (!role) return null
  return roleOrder.includes(role) ? role : null
}
