import type {
  IAddress,
  IContact,
  IEmail,
  IPhone,
} from '@/interfaces/ocotillo/IContact'

export type AmpRole = 'AMP.Viewer' | 'AMP.Editor' | 'AMP.Admin'

const legacyRoleMap: Record<string, AmpRole> = {
  Viewer: 'AMP.Viewer',
  Editor: 'AMP.Editor',
  Admin: 'AMP.Admin',
  AMPViewer: 'AMP.Viewer',
  AMPEditor: 'AMP.Editor',
  OcotilloAdmin: 'AMP.Admin',
  'AMP.Viewer': 'AMP.Viewer',
  'AMP.Editor': 'AMP.Editor',
  'AMP.Admin': 'AMP.Admin',
}

const roleOrder: AmpRole[] = ['AMP.Viewer', 'AMP.Editor', 'AMP.Admin']

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

export const normalizeAccessControlGroups = (
  groups: string[] | null | undefined
): AmpRole[] => {
  const normalized = new Set<AmpRole>()

  for (const group of groups ?? []) {
    const mapped = legacyRoleMap[group]
    if (mapped) {
      normalized.add(mapped)
    }
  }

  if (normalized.has('AMP.Admin')) {
    return ['AMP.Viewer', 'AMP.Editor', 'AMP.Admin']
  }
  if (normalized.has('AMP.Editor')) {
    return ['AMP.Viewer', 'AMP.Editor']
  }
  if (normalized.has('AMP.Viewer')) {
    return ['AMP.Viewer']
  }

  return []
}

export const getPrimaryRole = (
  groups: string[] | null | undefined
): AmpRole | null => {
  const normalized = normalizeAccessControlGroups(groups)
  return normalized.length > 0 ? normalized[normalized.length - 1] : null
}

export const getAccessCapabilities = (
  groups: string[] | null | undefined
) => {
  const roles = normalizeAccessControlGroups(groups)
  const primaryRole = getPrimaryRole(groups)
  const canViewAmp = roles.length > 0
  const canEditAmp = roles.includes('AMP.Editor') || roles.includes('AMP.Admin')
  const canManageAmp = roles.includes('AMP.Admin')
  const canViewConfidential = canEditAmp
  const canViewUnfinished = canManageAmp

  return {
    roles,
    primaryRole,
    canViewAmp,
    canEditAmp,
    canManageAmp,
    canViewConfidential,
    canViewUnfinished,
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

  if (resource === 'Sandbox') {
    return (action === 'list' || action === 'show') && capabilities.canViewAmp
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
