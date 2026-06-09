import {
  BookOpen,
  Database,
  Droplets,
  FileText,
  Home,
  LineChart,
  Map as MapIcon,
  MapPin,
  Search,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
   * Renders as non-interactive. Use for features not yet implemented.
   */
  disabled?: boolean
  /**
   * Shows a lock badge next to the label. Set on items only AMP.Admin can see.
   * Non-admins never see these items (CanAccess hides them); the badge is for
   * admins who need to understand why an item is restricted.
   */
  adminOnly?: boolean
}

/**
 * Top bar: views and tools.
 * Items without a `resource` are visible to every authenticated user.
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
    // AppShell wires onClick={openSearch} for this id
  },
  {
    label: 'Map',
    href: '/ocotillo/map',
    icon: MapIcon,
    resource: 'ocotillo.map', // AMP.Viewer+
  },
]

/**
 * Data section: record management and tools.
 * Each item is gated by CanAccess(resource, action="list").
 *
 * AMP.Viewer+  — Wells, Field Sheets, Contacts, Datasets
 * AMP.Admin    — Locations, Lexicon, Hydrograph Correction
 */
export const RESOURCE_NAV: NavItem[] = [
  {
    label: 'Wells',
    href: '/ocotillo/well',
    icon: Droplets,
    resource: 'ocotillo.thing-well', // AMP.Viewer+
  },
  {
    label: 'Field Sheets',
    href: '/ocotillo/well/batch-export',
    icon: FileText,
    resource: 'ocotillo.thing-well-batch-export', // AMP.Viewer+
  },
  {
    label: 'Contacts',
    href: '/ocotillo/contact',
    icon: Users,
    resource: 'ocotillo.contact', // AMP.Viewer+
  },
  {
    label: 'Datasets',
    href: '/ocotillo/collections',
    icon: Database,
    resource: 'ocotillo.collections', // AMP.Viewer+
  },
  {
    label: 'Locations',
    href: '/ocotillo/location',
    icon: MapPin,
    resource: 'ocotillo.location', // AMP.Admin only
    adminOnly: true,
  },
  {
    label: 'Lexicon',
    href: '/ocotillo/lexicon',
    icon: BookOpen,
    resource: 'ocotillo.lexicon', // AMP.Admin only
    adminOnly: true,
  },
  {
    label: 'Hydrograph Correction',
    href: '/ocotillo/hydrograph-correction',
    icon: LineChart,
    resource: 'ocotillo.hydrograph-correction', // AMP.Admin only
    adminOnly: true,
  },
]
