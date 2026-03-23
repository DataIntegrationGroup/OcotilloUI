import { describe, expect, it } from 'vitest'
import { canAccessResource, getAccessCapabilities } from '@/utils/accessControl'

describe('accessControl', () => {
  it('allows AMP.Viewer to see the map and lexicon', () => {
    const groups = ['AMP.Viewer']

    expect(
      canAccessResource({ groups, resource: 'ocotillo.map', action: 'list' })
    ).toBe(true)
    expect(
      canAccessResource({
        groups,
        resource: 'ocotillo.lexicon',
        action: 'list',
      })
    ).toBe(true)
    expect(
      canAccessResource({
        groups,
        resource: 'ocotillo.contact',
        action: 'list',
      })
    ).toBe(true)
  })

  it('allows AMP.Viewer to view confidential data flags and blocks Sandbox', () => {
    const capabilities = getAccessCapabilities(['AMP.Viewer'])

    expect(capabilities.canViewConfidential).toBe(true)
    expect(
      canAccessResource({
        groups: ['AMP.Viewer'],
        resource: 'Sandbox',
        action: 'list',
      })
    ).toBe(false)
    expect(
      canAccessResource({
        groups: ['AMP.Admin'],
        resource: 'Sandbox',
        action: 'list',
      })
    ).toBe(true)
  })

  it('limits Locations to AMP.Admin or Geothermal.Admin', () => {
    expect(
      canAccessResource({
        groups: ['AMP.Viewer'],
        resource: 'water.locations',
        action: 'list',
      })
    ).toBe(false)
    expect(
      canAccessResource({
        groups: ['AMP.Editor'],
        resource: 'water.locations',
        action: 'list',
      })
    ).toBe(false)
    expect(
      canAccessResource({
        groups: ['Geothermal.Editor'],
        resource: 'water.locations',
        action: 'list',
      })
    ).toBe(false)
    expect(
      canAccessResource({
        groups: ['AMP.Admin'],
        resource: 'water.locations',
        action: 'show',
      })
    ).toBe(true)
    expect(
      canAccessResource({
        groups: ['Geothermal.Admin'],
        resource: 'water.locations',
        action: 'show',
      })
    ).toBe(true)
    expect(
      canAccessResource({
        groups: ['AMP.Admin'],
        resource: 'water.locations',
        action: 'edit',
      })
    ).toBe(true)
    expect(
      canAccessResource({
        groups: ['Geothermal.Admin'],
        resource: 'water.locations',
        action: 'edit',
      })
    ).toBe(true)
  })

  it('does not treat geothermal-only roles as AMP access', () => {
    const capabilities = getAccessCapabilities(['Geothermal.Viewer'])

    expect(capabilities.canViewAmp).toBe(false)
    expect(capabilities.canViewGeothermal).toBe(true)
    expect(
      canAccessResource({
        groups: ['Geothermal.Viewer'],
        resource: 'ocotillo.map',
        action: 'list',
      })
    ).toBe(false)
  })
})
