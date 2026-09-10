import { describe, expect, it } from 'vitest'
import {
  AMP_NAV_ID,
  GEOTHERMAL_NAV,
  RESOURCE_NAV,
  type NavItem,
} from '@/config/navigation'
import { canAccessResource } from '@/utils/accessControl'

const byLabel = (items: NavItem[], label: string) =>
  items.find((item) => item.label === label)

const amp = byLabel(RESOURCE_NAV, 'AMP')

describe('AMP nav group', () => {
  it('holds Wells, Field Sheets and Contacts', () => {
    expect(amp).toBeDefined()
    expect(amp?.children?.map((child) => child.label)).toEqual([
      'Wells',
      'Field Sheets',
      'Contacts',
    ])
  })

  it('no longer lists those three at the top level', () => {
    for (const label of ['Wells', 'Field Sheets', 'Contacts']) {
      expect(byLabel(RESOURCE_NAV, label)).toBeUndefined()
    }
  })

  it('names no resource of its own, leaving the gating to its children', () => {
    expect(amp?.resource).toBeUndefined()
    for (const child of amp?.children ?? []) {
      expect(child.resource).toBeTruthy()
    }
  })

  it('keeps its children reachable for a viewer', () => {
    for (const child of amp?.children ?? []) {
      expect(
        canAccessResource({
          groups: ['AMP.Viewer'],
          resource: child.resource!,
          action: 'list',
        })
      ).toBe(true)
    }
  })

  it('has no href of its own, so its header toggles instead of navigating', () => {
    expect(amp?.href).toBeNull()
    // The renderer matches on child hrefs, which is what keeps the group open
    // while you are on one of its pages.
    expect(amp?.children?.map((child) => child.href)).toEqual([
      '/ocotillo/well',
      '/ocotillo/well/batch-export',
      '/ocotillo/contact',
    ])
  })

  it('carries the id AppShell anchors the geothermal group to', () => {
    // AppShell renders GEOTHERMAL_NAV straight after this entry; matching on
    // the id rather than the label keeps a rewording from moving it.
    expect(amp?.id).toBe(AMP_NAV_ID)
    expect(RESOURCE_NAV.filter((item) => item.id === AMP_NAV_ID)).toHaveLength(
      1
    )
  })

  it('is the first entry, so the geothermal group lands second', () => {
    expect(RESOURCE_NAV[0]?.id).toBe(AMP_NAV_ID)
  })

  it('leaves the other top-level entries in place', () => {
    for (const label of [
      'Projects',
      'Datasets',
      'Unassociated Assets',
      'Locations',
      'Lexicon',
      'Hydrograph Correction',
    ]) {
      expect(byLabel(RESOURCE_NAV, label)).toBeDefined()
    }
  })
})

describe('Geothermal nav group', () => {
  it('holds Records, Inventory and Temp-Depth', () => {
    expect(GEOTHERMAL_NAV.children?.map((child) => child.label)).toEqual([
      'Records',
      'Inventory',
      'Temp-Depth',
    ])
  })

  it('points each page at its geothermal route', () => {
    expect(GEOTHERMAL_NAV.children?.map((child) => child.href)).toEqual([
      '/geothermal/wells/records-grid',
      '/geothermal/wells/inventory',
      '/geothermal/wells/temp-depth',
    ])
  })

  it('has no href of its own, so its header toggles instead of navigating', () => {
    expect(GEOTHERMAL_NAV.href).toBeNull()
  })

  it('is visible to every authenticated user', () => {
    expect(GEOTHERMAL_NAV.roles).toBeUndefined()
    expect(GEOTHERMAL_NAV.resource).toBeUndefined()
    for (const child of GEOTHERMAL_NAV.children ?? []) {
      expect(child.roles).toBeUndefined()
      expect(child.resource).toBeUndefined()
    }
  })

  it('stays out of RESOURCE_NAV, so AppShell places it below AMP', () => {
    expect(byLabel(RESOURCE_NAV, 'Geothermal')).toBeUndefined()
  })
})
