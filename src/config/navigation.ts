import {
  BookOpen,
  Database,
  Droplets,
  FileText,
  FolderKanban,
  Home,
  LineChart,
  Map as MapIcon,
  MapPin,
  Search,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PortalRole } from '@/utils/accessControl'

/**
 * Convenience references to AMP role strings.
 * Uses a const object rather than an enum so the values are assignable to
 * the existing PortalRole string union type without casting.
 */
export const AmpRole = {
  Viewer: 'AMP.Viewer',
  Editor: 'AMP.Editor',
  Admin:  'AMP.Admin',
} as const satisfies Record<string, PortalRole>

export type NavItem = {
  label: string
  href: string | null
  icon: LucideIcon
  /**
   * Stable identifier used by AppShell to attach runtime handlers (e.g. "search").
   */
  id?: string
  /**
   * Refine resource name for permission checking via CanAccess(action="list").
   * Omit for items that are visible to all authenticated users (Home, placeholders).
   */
  resource?: string
  /**
   * Which portal roles can see this item. Omit to make it visible to all
   * authenticated users. AppShell uses this to filter nav items before
   * rendering; CanAccess provides a second layer of enforcement at runtime.
   */
  roles?: PortalRole[]
  /**
   * Renders as non-interactive. Use for features not yet implemented.
   */
  disabled?: boolean
  /**
   * Nested items shown under this entry in the sidebar (e.g. Projects under Wells).
   */
  children?: NavItem[]
}

/**
 * Top bar: views and tools.
 * Items without `roles` are visible to every authenticated user.
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    label: 'Home',
    href: '/home',
    icon: Home,
  },
  {
    id: 'search',
    label: 'Search',
    href: null,
    icon: Search,
  },
  {
    label: 'Map',
    href: '/ocotillo/map',
    icon: MapIcon,
    resource: 'ocotillo.map',
  },
]

const viewerAndAbove: PortalRole[] = [AmpRole.Viewer, AmpRole.Editor, AmpRole.Admin]
const adminOnly: PortalRole[] = [AmpRole.Admin]

/**
 * Data section: record management and tools.
 * Each item is gated by its `roles` array in AppShell, with CanAccess as a
 * second enforcement layer.
 */
export const RESOURCE_NAV: NavItem[] = [
  {
    label: 'Wells',
    href: '/ocotillo/well',
    icon: Droplets,
    resource: 'ocotillo.thing-well',
    roles: viewerAndAbove,
  },
  {
    label: 'Projects',
    href: '/ocotillo/well/projects',
    icon: FolderKanban,
    resource: 'ocotillo.thing-well-projects',
    roles: viewerAndAbove,
  },
  {
    label: 'Field Sheets',
    href: '/ocotillo/well/batch-export',
    icon: FileText,
    resource: 'ocotillo.thing-well-batch-export',
    roles: viewerAndAbove,
  },
  {
    label: 'Contacts',
    href: '/ocotillo/contact',
    icon: Users,
    resource: 'ocotillo.contact',
    roles: viewerAndAbove,
  },
  {
    label: 'Datasets',
    href: '/ocotillo/collections',
    icon: Database,
    resource: 'ocotillo.collections',
    roles: viewerAndAbove,
  },
  {
    label: 'Locations',
    href: '/ocotillo/location',
    icon: MapPin,
    resource: 'ocotillo.location',
    roles: adminOnly,
  },
  {
    label: 'Lexicon',
    href: '/ocotillo/lexicon',
    icon: BookOpen,
    resource: 'ocotillo.lexicon',
    roles: adminOnly,
  },
  {
    label: 'Hydrograph Correction',
    href: '/ocotillo/hydrograph-correction',
    icon: LineChart,
    resource: 'ocotillo.hydrograph-correction',
    roles: adminOnly,
  },
]
