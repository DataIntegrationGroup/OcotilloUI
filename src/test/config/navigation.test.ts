import { describe, expect, it } from 'vitest'
import { AMP_NAV_ID, RESOURCE_NAV, type NavItem } from '@/config/navigation'
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

  it('points at a href its children sit under, so the group opens with them', () => {
    const parent = amp?.href
    expect(parent).toBe('/ocotillo/well')
    // Field Sheets nests under the parent href; Contacts does not, which is why
    // the renderer also matches on child hrefs.
    expect(byLabel(amp?.children ?? [], 'Contacts')?.href).toBe(
      '/ocotillo/contact'
    )
  })

  it('carries the id AppShell anchors the geothermal group to', () => {
    // AppShell renders GeothermalNavItem straight after this entry; matching on
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
