import { describe, expect, it } from 'vitest'
import {
  canAccessResource,
  getAccessCapabilities,
  isResourceListAdminOnly,
  normalizeAccessControlGroups,
} from '@/utils/accessControl'
import { resources } from '@/resources'

type Action = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'manage'
type Scenario = {
  name: string
  groups: string[] | null | undefined
  allowedResources: string[]
}
type ResourceWithRoutes = (typeof resources)[number] & {
  list?: string
  show?: string
  edit?: string
  create?: string
}

const actions: Action[] = ['list', 'show']

const isRoutableResource = (
  resource: (typeof resources)[number]
): resource is ResourceWithRoutes =>
  'list' in resource ||
  'show' in resource ||
  'edit' in resource ||
  'create' in resource

const routableResources = resources.filter(isRoutableResource)
const routableResourceNames = routableResources
  .map((resource) => resource.name)
  .sort()
const expectedRegisteredRoutableResources = [
  'geothermal.dashboard',
  'geothermal.geothermal_wells',
  'ocotillo.asset-unassociated',
  'ocotillo.chemistry-report',
  'ocotillo.collections',
  'ocotillo.contact',
  'ocotillo.hydrograph-correction',
  'ocotillo.lexicon',
  'ocotillo.location',
  'ocotillo.map',
  'ocotillo.thing-well',
  'ocotillo.thing-well-batch-export',
  'ocotillo.thing-well-pdf-preview',
  'ocotillo.thing-well-projects',
].sort()

// Geothermal resources are a separate portal — accessible to Geothermal roles
// (list/show), not AMP roles.
const GEOTHERMAL_ROUTABLE = [
  'geothermal.dashboard',
  'geothermal.geothermal_wells',
]

// AMP.Staging is an opt-in flag group, not a rung on the AMP ladder. Nothing
// else grants these resources — AMP.Admin included.
const STAGING_ONLY_ROUTABLE = ['ocotillo.chemistry-report']

const expectedAccessByScenario: Scenario[] = [
  {
    name: 'anonymous',
    groups: null,
    allowedResources: [],
  },
  {
    name: 'AMP.Viewer',
    groups: ['AMP.Viewer'],
    allowedResources: [
      'ocotillo.collections',
      'ocotillo.map',
      'ocotillo.contact',
      'ocotillo.thing-well',
      'ocotillo.thing-well-batch-export',
      'ocotillo.thing-well-projects',
    ],
  },
  {
    name: 'AMP.Editor',
    groups: ['AMP.Editor'],
    allowedResources: [
      'ocotillo.collections',
      'ocotillo.map',
      'ocotillo.thing-well',
      'ocotillo.contact',
      'ocotillo.hydrograph-correction',
      'ocotillo.asset-unassociated',
      'ocotillo.thing-well-batch-export',
      'ocotillo.thing-well-projects',
    ],
  },
  {
    name: 'AMP.Admin',
    groups: ['AMP.Admin'],
    // AMP.Admin owns the water portal, not geothermal — and not the
    // staging-flagged resources, which need the AMP.Staging group explicitly.
    allowedResources: routableResources
      .map((resource) => resource.name)
      .filter(
        (name) =>
          !name.startsWith('geothermal.') &&
          !STAGING_ONLY_ROUTABLE.includes(name)
      ),
  },
  {
    name: 'AMP.Staging',
    groups: ['AMP.Staging'],
    allowedResources: [...STAGING_ONLY_ROUTABLE],
  },
  {
    name: 'AMP.Admin + AMP.Staging',
    groups: ['AMP.Admin', 'AMP.Staging'],
    allowedResources: routableResources
      .map((resource) => resource.name)
      .filter((name) => !name.startsWith('geothermal.')),
  },
  {
    name: 'Geothermal.Viewer',
    groups: ['Geothermal.Viewer'],
    allowedResources: [...GEOTHERMAL_ROUTABLE],
  },
  {
    name: 'Geothermal.Editor',
    groups: ['Geothermal.Editor'],
    allowedResources: [...GEOTHERMAL_ROUTABLE],
  },
  {
    name: 'Geothermal.Admin',
    groups: ['Geothermal.Admin'],
    allowedResources: [
      'water.locations',
      'ocotillo.location',
      ...GEOTHERMAL_ROUTABLE,
    ],
  },
  {
    name: 'AMP.Viewer + Geothermal.Editor',
    groups: ['AMP.Viewer', 'Geothermal.Editor'],
    allowedResources: [
      'ocotillo.collections',
      'ocotillo.map',
      'ocotillo.thing-well',
      'ocotillo.contact',
      'ocotillo.thing-well-batch-export',
      'ocotillo.thing-well-projects',
      ...GEOTHERMAL_ROUTABLE,
    ],
  },
]

const specialResourceExpectations: Array<{
  name: string
  groups: string[] | null | undefined
  resource: string
  action: Action
  expected: boolean
}> = [
  {
    name: 'anonymous cannot see ocotillo root',
    groups: null,
    resource: 'ocotillo',
    action: 'list',
    expected: false,
  },
  {
    name: 'AMP viewer can see collections',
    groups: ['AMP.Viewer'],
    resource: 'ocotillo.collections',
    action: 'list',
    expected: true,
  },
  {
    name: 'AMP viewer can see contacts',
    groups: ['AMP.Viewer'],
    resource: 'ocotillo.contact',
    action: 'list',
    expected: true,
  },
  {
    name: 'AMP editor cannot see ocotillo.location',
    groups: ['AMP.Editor'],
    resource: 'ocotillo.location',
    action: 'list',
    expected: false,
  },
  {
    name: 'AMP editor can see contacts',
    groups: ['AMP.Editor'],
    resource: 'ocotillo.contact',
    action: 'show',
    expected: true,
  },
  {
    name: 'AMP viewer cannot access ocotillo hydrograph correction',
    groups: ['AMP.Viewer'],
    resource: 'ocotillo.hydrograph-correction',
    action: 'list',
    expected: false,
  },
  {
    name: 'AMP editor can access ocotillo hydrograph correction',
    groups: ['AMP.Editor'],
    resource: 'ocotillo.hydrograph-correction',
    action: 'show',
    expected: true,
  },
  {
    // Correcting and publishing is an editor task; deleting stored
    // transducer observations is not.
    name: 'AMP editor cannot delete ocotillo hydrograph stored data',
    groups: ['AMP.Editor'],
    resource: 'ocotillo.hydrograph-correction',
    action: 'delete',
    expected: false,
  },
  {
    name: 'AMP admin can delete ocotillo hydrograph stored data',
    groups: ['AMP.Admin'],
    resource: 'ocotillo.hydrograph-correction',
    action: 'delete',
    expected: true,
  },
  {
    name: 'AMP admin can access ocotillo hydrograph correction',
    groups: ['AMP.Admin'],
    resource: 'ocotillo.hydrograph-correction',
    action: 'show',
    expected: true,
  },
  {
    name: 'AMP editor cannot access hidden PDF preview',
    groups: ['AMP.Editor'],
    resource: 'ocotillo.thing-well-pdf-preview',
    action: 'show',
    expected: false,
  },
  {
    name: 'AMP admin can access hidden PDF preview',
    groups: ['AMP.Admin'],
    resource: 'ocotillo.thing-well-pdf-preview',
    action: 'show',
    expected: true,
  },
  {
    name: 'AMP editor cannot list water.locations',
    groups: ['AMP.Editor'],
    resource: 'water.locations',
    action: 'list',
    expected: false,
  },
  {
    name: 'AMP admin can list water.locations',
    groups: ['AMP.Admin'],
    resource: 'water.locations',
    action: 'list',
    expected: true,
  },
  {
    name: 'Geothermal admin can show water.locations',
    groups: ['Geothermal.Admin'],
    resource: 'water.locations',
    action: 'show',
    expected: true,
  },
  {
    name: 'AMP admin can show ocotillo.location',
    groups: ['AMP.Admin'],
    resource: 'ocotillo.location',
    action: 'show',
    expected: true,
  },
  {
    name: 'Geothermal admin can show ocotillo.location',
    groups: ['Geothermal.Admin'],
    resource: 'ocotillo.location',
    action: 'show',
    expected: true,
  },
  {
    name: 'AMP editor cannot create water.locations',
    groups: ['AMP.Editor'],
    resource: 'water.locations',
    action: 'create',
    expected: false,
  },
  {
    name: 'AMP editor can manage water.wellinventoryform',
    groups: ['AMP.Editor'],
    resource: 'water.wellinventoryform',
    action: 'manage',
    expected: true,
  },
  {
    name: 'AMP editor can manage unassociated assets',
    groups: ['AMP.Editor'],
    resource: 'ocotillo.asset-unassociated',
    action: 'manage',
    expected: true,
  },
  {
    name: 'AMP editor can delete unassociated assets',
    groups: ['AMP.Editor'],
    resource: 'ocotillo.asset-unassociated',
    action: 'delete',
    expected: true,
  },
  {
    name: 'geothermal editor can edit geothermal resources',
    groups: ['Geothermal.Editor'],
    resource: 'geothermal.dashboard',
    action: 'edit',
    expected: true,
  },
  {
    name: 'geothermal editor cannot manage geothermal resources',
    groups: ['Geothermal.Editor'],
    resource: 'geothermal.dashboard',
    action: 'manage',
    expected: false,
  },
  {
    name: 'AMP viewer cannot access unknown resource',
    groups: ['AMP.Viewer'],
    resource: 'unknown.resource',
    action: 'list',
    expected: false,
  },
  {
    name: 'AMP admin is denied unknown resources by default',
    groups: ['AMP.Admin'],
    resource: 'unknown.resource',
    action: 'list',
    expected: false,
  },
]

describe('accessControl helpers', () => {
  it('normalizes canonical roles and expands hierarchies', () => {
    expect(normalizeAccessControlGroups(['AMP.Viewer'])).toEqual(['AMP.Viewer'])
    expect(normalizeAccessControlGroups(['AMP.Editor'])).toEqual([
      'AMP.Viewer',
      'AMP.Editor',
    ])
    expect(normalizeAccessControlGroups(['AMP.Admin'])).toEqual([
      'AMP.Viewer',
      'AMP.Editor',
      'AMP.Admin',
    ])
    expect(normalizeAccessControlGroups(['Geothermal.Admin'])).toEqual([
      'Geothermal.Viewer',
      'Geothermal.Editor',
      'Geothermal.Admin',
    ])
    expect(
      normalizeAccessControlGroups(['AMP.Viewer', 'Geothermal.Editor'])
    ).toEqual(['AMP.Viewer', 'Geothermal.Viewer', 'Geothermal.Editor'])
  })

  it('derives capability flags from normalized roles', () => {
    expect(getAccessCapabilities(null)).toMatchObject({
      roles: [],
      primaryRole: null,
      canViewAmp: false,
      canEditAmp: false,
      canManageAmp: false,
      canManageAssets: false,
      canViewConfidential: false,
      canViewUnfinished: false,
      canViewGeothermal: false,
      canEditGeothermal: false,
      canManageGeothermal: false,
      canViewLexicon: false,
    })

    expect(getAccessCapabilities(['AMP.Viewer'])).toMatchObject({
      roles: ['AMP.Viewer'],
      primaryRole: 'AMP.Viewer',
      canViewAmp: true,
      canEditAmp: false,
      canManageAmp: false,
      canManageAssets: false,
      canViewConfidential: false,
      canViewUnfinished: false,
      canViewGeothermal: false,
      canEditGeothermal: false,
      canManageGeothermal: false,
      canViewLexicon: false,
    })

    expect(getAccessCapabilities(['AMP.Editor'])).toMatchObject({
      roles: ['AMP.Viewer', 'AMP.Editor'],
      primaryRole: 'AMP.Editor',
      canViewAmp: true,
      canEditAmp: true,
      canManageAmp: false,
      canManageAssets: true,
      canViewConfidential: true,
      canViewUnfinished: false,
      canViewLexicon: true,
    })

    expect(
      getAccessCapabilities(['AMP.Admin', 'Geothermal.Editor'])
    ).toMatchObject({
      roles: [
        'AMP.Viewer',
        'AMP.Editor',
        'AMP.Admin',
        'Geothermal.Viewer',
        'Geothermal.Editor',
      ],
      primaryRole: 'Geothermal.Editor',
      canManageAmp: true,
      canManageAssets: true,
      canViewUnfinished: true,
      canEditGeothermal: true,
      canManageGeothermal: false,
    })
  })
})

describe('accessControl registered resource matrix', () => {
  it('keeps the matrix decision-complete for every routable registered resource', () => {
    expect(routableResourceNames).toEqual(expectedRegisteredRoutableResources)
  })

  for (const scenario of expectedAccessByScenario) {
    it(`applies list/show access for ${scenario.name}`, () => {
      const expected = new Set(scenario.allowedResources)

      for (const resource of routableResources) {
        for (const action of actions) {
          expect(
            canAccessResource({
              groups: scenario.groups,
              resource: resource.name,
              action,
            }),
            `${scenario.name} ${action} ${resource.name}`
          ).toBe(expected.has(resource.name))
        }
      }
    })
  }
})

describe('accessControl special resources and write gates', () => {
  for (const testCase of specialResourceExpectations) {
    it(testCase.name, () => {
      expect(
        canAccessResource({
          groups: testCase.groups,
          resource: testCase.resource,
          action: testCase.action,
        })
      ).toBe(testCase.expected)
    })
  }
})

describe('isResourceListAdminOnly', () => {
  it('returns true for list resources restricted to admin roles', () => {
    expect(isResourceListAdminOnly('ocotillo.location')).toBe(true)
    expect(isResourceListAdminOnly('ocotillo.lexicon')).toBe(true)
    expect(isResourceListAdminOnly('water.locations')).toBe(true)
  })

  it('returns false for non-admin list resources and unknown resources', () => {
    expect(isResourceListAdminOnly('ocotillo.thing-well')).toBe(false)
    expect(isResourceListAdminOnly('ocotillo.hydrograph-correction')).toBe(false)
    expect(isResourceListAdminOnly('ocotillo.asset-unassociated')).toBe(false)
    expect(isResourceListAdminOnly('unknown.resource')).toBe(false)
  })
})
