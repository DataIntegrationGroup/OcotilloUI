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

// Temporary compatibility shim for pre-v1 Authentik group names.
// Remove these legacy aliases before the v1 release once all users/groups
// have been migrated to AMP.Viewer / AMP.Editor / AMP.Admin.
const legacyRoleMap: Record<string, PortalRole> = {
  Viewer: 'AMP.Viewer',
  Editor: 'AMP.Editor',
  Admin: 'AMP.Admin',
  AMPViewer: 'AMP.Viewer',
  AMPEditor: 'AMP.Editor',
  OcotilloAdmin: 'AMP.Admin',
  'AMP.Viewer': 'AMP.Viewer',
  'AMP.Editor': 'AMP.Editor',
  'AMP.Admin': 'AMP.Admin',
  'Geothermal.Viewer': 'Geothermal.Viewer',
  'Geothermal.Editor': 'Geothermal.Editor',
  'Geothermal.Admin': 'Geothermal.Admin',
}

const roleOrder: PortalRole[] = [
  'AMP.Viewer',
  'AMP.Editor',
  'AMP.Admin',
  'Geothermal.Viewer',
  'Geothermal.Editor',
  'Geothermal.Admin',
]

const editableOcotilloResources = [
  'ocotillo.sensor',
  'ocotillo.group',
  'ocotillo.location',
  'ocotillo.sample',
  'ocotillo.asset',
  'ocotillo.contact',
  'ocotillo.thing-well',
  'ocotillo.thing-spring',
  'ocotillo.groundwater-level-observation',
]

const viewableOcotilloResources = [
  'ocotillo',
  'ocotillo.map',
  'ocotillo.lexicon',
  'ocotillo.thing-well',
  'ocotillo.thing-spring',
  'ocotillo.thing-well-pdf-preview',
  'ocotillo.thing-well-batch-export',
  'ocotillo.groundwater-level-observation',
  ...editableOcotilloResources,
]

export const wipResources = new Set([
  'water.dashboard',
  'water.hydrographcorrector',
  'water.reportbuilder',
  'water.querybuilder',
  'water.wellinventoryform',
  'water.waterlevelform',
  'water.projects',
  'water.locations',
  'water.wells',
  'water.equipment',
  'water.manual_waterlevels',
  'water.chemupload',
  'water.manualwaterlevels_batchupload',
])

export const crossDomainAdminOnlyResources = new Set([
  'water.locations',
])

export const normalizeAccessControlGroups = (
  groups: string[] | null | undefined
): PortalRole[] => {
  const normalized = new Set<PortalRole>()

  for (const group of groups ?? []) {
    const mapped = legacyRoleMap[group]
    if (mapped) {
      normalized.add(mapped)
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

export const getAccessCapabilities = (
  groups: string[] | null | undefined
) => {
  const roles = normalizeAccessControlGroups(groups)
  const primaryRole = getPrimaryRole(groups)
  const canViewAmp =
    roles.includes('AMP.Viewer') ||
    roles.includes('AMP.Editor') ||
    roles.includes('AMP.Admin')
  const canEditAmp = roles.includes('AMP.Editor') || roles.includes('AMP.Admin')
  const canManageAmp = roles.includes('AMP.Admin')
  const canViewConfidential = canViewAmp
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
    canViewLexicon: true,
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

  if (resource === 'ocotillo.lexicon') {
    return action === 'list' || action === 'show'
  }

  if (resource === 'ocotillo') {
    return action === 'list' || action === 'show'
  }

  if (resource === 'ocotillo.thing-well-pdf-preview') {
    return (action === 'list' || action === 'show') && capabilities.canManageAmp
  }

  if (resource === 'Sandbox') {
    return (action === 'list' || action === 'show') && capabilities.canManageAmp
  }

  if (resource === 'geothermal') {
    return (
      (action === 'list' || action === 'show') &&
      capabilities.canViewGeothermal
    )
  }

  if (crossDomainAdminOnlyResources.has(resource)) {
    return capabilities.canManageAmp || capabilities.canManageGeothermal
  }

  if (isWip || wipResources.has(resource)) {
    return capabilities.canViewUnfinished
  }

  if (resource.startsWith('water.')) {
    if (!capabilities.canViewAmp) return false
    if (action === 'list' || action === 'show') {
      return !wipResources.has(resource)
    }
    return capabilities.canManageAmp
  }

  if (resource.startsWith('geothermal.')) {
    if (action === 'list' || action === 'show') {
      return capabilities.canViewGeothermal
    }
    if (action === 'edit') {
      return capabilities.canEditGeothermal
    }
    if (action === 'create' || action === 'delete' || action === 'manage') {
      return capabilities.canManageGeothermal
    }
  }

  if (viewableOcotilloResources.includes(resource)) {
    if (action === 'list' || action === 'show') {
      return capabilities.canViewAmp
    }
    if (editableOcotilloResources.includes(resource) && action === 'edit') {
      return capabilities.canEditAmp
    }
    if (action === 'create' || action === 'delete' || action === 'manage') {
      return capabilities.canManageAmp
    }
  }

  return capabilities.canManageAmp
}

const isPrivateReleaseStatus = (releaseStatus?: string | null): boolean =>
  (releaseStatus ?? '').toLowerCase() === 'private'

const filterPublicOnly = <T extends { release_status?: string | null }>(
  items: T[] | undefined | null
): T[] => (items ?? []).filter((item) => !isPrivateReleaseStatus(item.release_status))

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
    role: contactIsPrivate ? undefined : contact.role,
    contact_type: contactIsPrivate ? undefined : contact.contact_type,
    emails: sanitizeContactMethods(contact.emails, false) as IEmail[] | undefined,
    phones: sanitizeContactMethods(contact.phones, false) as IPhone[] | undefined,
    addresses: sanitizeContactMethods(
      contact.addresses,
      false
    ) as IAddress[] | undefined,
  }
}

export const sanitizeContacts = (
  contacts: readonly IContact[] | undefined | null,
  canViewConfidential: boolean
): IContact[] => (contacts ?? []).map((contact) => sanitizeContact(contact, canViewConfidential))

export const filterConfidentialRows = <T extends { release_status?: string | null }>(
  rows: T[] | undefined | null,
  canViewConfidential: boolean
): T[] => (canViewConfidential ? rows ?? [] : filterPublicOnly(rows))

export const highestRoleLabel = (groups: string[] | null | undefined): string | null => {
  const role = getPrimaryRole(groups)
  if (!role) return null
  return roleOrder.includes(role) ? role : null
}
