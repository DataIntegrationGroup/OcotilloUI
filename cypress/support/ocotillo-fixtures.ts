/// <reference types="cypress" />

export const projectAlpha = {
  id: 10,
  name: 'Rio Grande Monitoring',
  description: 'Long-term water level monitoring in the middle Rio Grande.',
  group_type: 'Project',
  release_status: 'public',
  parent_group_id: null,
  project_area: null,
  well_count: 2,
  created_at: '2026-01-05T12:00:00Z',
  created_by_name: 'Data Team',
}

export const projectBeta = {
  id: 11,
  name: 'Chuska Reconnaissance',
  description: 'Reconnaissance wells near Chuska.',
  group_type: 'Project',
  release_status: 'draft',
  parent_group_id: null,
  project_area: null,
  well_count: 1,
  created_at: '2026-02-10T12:00:00Z',
  created_by_name: 'Field Team',
}

export const wellOne = {
  id: 1,
  name: 'RG-001',
  site_name: 'Rio Grande Site 1',
  created_at: '2026-01-15T12:00:00Z',
  release_status: 'public',
  thing_type: 'water well',
  location_id: 101,
  monitoring_status: 'Active',
  well_status: 'In use',
  hole_depth: 210,
  hole_depth_unit: 'ft',
  well_depth: 198,
  well_depth_unit: 'ft',
  well_completion_date: '2025-12-10',
  well_driller_name: 'Mesa Drilling',
  measuring_point_description: 'Top of casing',
  measuring_point_height: 2.5,
  measuring_point_height_unit: 'ft',
  first_visit_date: '2026-01-20',
  groups: [projectAlpha],
  contacts: [
    {
      id: 1,
      name: 'Alex Contact',
      organization: 'NMBGMR',
      role: 'Owner',
      contact_type: 'Primary',
      release_status: 'public',
    },
  ],
  aquifers: [
    { aquifer_system: 'Santa Fe Group', aquifer_types: ['basin fill'] },
  ],
  alternate_ids: [
    {
      id: 1001,
      alternate_organization: 'USGS',
      alternate_id: '08300000',
      relation: 'site id',
    },
  ],
  current_location: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-106.65, 35.08, 5000],
    },
    properties: {
      elevation: 5000,
      elevation_unit: 'ft',
    },
  },
}

export const wellTwo = {
  id: 2,
  name: 'RG-002',
  site_name: 'Rio Grande Site 2',
  created_at: '2026-01-20T12:00:00Z',
  release_status: 'public',
  thing_type: 'water well',
  location_id: 102,
  monitoring_status: 'Inactive',
  well_status: 'Plugged',
  hole_depth: 150,
  hole_depth_unit: 'ft',
  well_depth: 140,
  well_depth_unit: 'ft',
  groups: [projectAlpha, projectBeta],
  contacts: [],
  current_location: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-106.7, 35.12, 5020],
    },
    properties: {
      elevation: 5020,
      elevation_unit: 'ft',
    },
  },
}

export const contactOne = {
  id: 1,
  name: 'Alex Contact',
  organization: 'NMBGMR',
  role: 'Owner',
  contact_type: 'Primary',
  release_status: 'public',
  created_at: '2026-01-01T00:00:00Z',
  things: [wellOne],
  phones: [
    {
      id: 1,
      contact_id: 1,
      phone_type: 'Primary',
      phone_number: '5055551212',
      release_status: 'public',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  emails: [
    {
      id: 1,
      contact_id: 1,
      email_type: 'Primary',
      email: 'alex@example.org',
      release_status: 'public',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  addresses: [
    {
      id: 1,
      contact_id: 1,
      address_type: 'Mailing',
      address_line_1: '801 Leroy Place',
      city: 'Socorro',
      state: 'NM',
      postal_code: '87801',
      country: 'USA',
      release_status: 'public',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
}

export const contactTwo = {
  id: 2,
  name: 'Jordan Manager',
  organization: 'Bureau of Geology',
  role: 'Manager',
  contact_type: 'Secondary',
  release_status: 'public',
  created_at: '2026-02-01T00:00:00Z',
  things: [wellTwo],
  phones: [],
  emails: [],
  addresses: [],
}

const listResponse = (items: unknown[]) => ({
  items,
  total: items.length,
})

export const interceptOcotilloListFixtures = () => {
  cy.intercept('GET', 'http://localhost:8000/thing/water-well*', (req) => {
    const query = String(req.query.name_contains ?? '').toLowerCase()
    const groupFilter = ([] as string[]).concat(req.query.filter ?? [])
    const wantsProjectAlpha = groupFilter.some(
      (filter) => filter.includes('"groups"') && filter.includes('"10"')
    )

    let wells = [wellOne, wellTwo]
    if (wantsProjectAlpha)
      wells = wells.filter((well) => well.groups.some((g) => g.id === 10))
    if (query)
      wells = wells.filter((well) => well.name.toLowerCase().includes(query))

    req.reply({ statusCode: 200, body: listResponse(wells) })
  }).as('getWells')

  cy.intercept('GET', 'http://localhost:8000/group*', {
    statusCode: 200,
    body: listResponse([projectAlpha, projectBeta]),
  }).as('getProjects')

  cy.intercept('GET', 'http://localhost:8000/contact*', {
    statusCode: 200,
    body: listResponse([contactOne, contactTwo]),
  }).as('getContacts')
}

export const interceptWellShowFixtures = () => {
  cy.intercept('GET', 'http://localhost:8000/thing/water-well/1/details**', {
    statusCode: 200,
    body: {
      well: wellOne,
      contacts: [contactOne],
      sensors: [],
      deployments: [],
      well_screens: [],
      field_events: [],
      first_field_event: null,
    },
  }).as('getWellDetails')

  cy.intercept('GET', 'http://localhost:8000/asset*', {
    statusCode: 200,
    body: listResponse([]),
  }).as('getWellAssets')

  cy.intercept('GET', 'http://localhost:8000/thing/1/id-link*', {
    statusCode: 200,
    body: listResponse(wellOne.alternate_ids),
  }).as('getWellIdLinks')

  cy.intercept('GET', 'http://localhost:8000/observation/groundwater-level*', {
    statusCode: 200,
    body: listResponse([]),
  }).as('getGroundwaterLevels')

  cy.intercept(
    'GET',
    'http://localhost:8000/observation/transducer-groundwater-level*',
    {
      statusCode: 200,
      body: listResponse([]),
    }
  ).as('getTransducerGroundwaterLevels')
}

export const interceptProjectShowFixtures = () => {
  cy.intercept('GET', 'http://localhost:8000/group/10**', {
    statusCode: 200,
    body: projectAlpha,
  }).as('getProject')

  cy.intercept('GET', 'http://localhost:8000/thing/water-well*', {
    statusCode: 200,
    body: listResponse([wellOne, wellTwo]),
  }).as('getProjectWells')
}

export const interceptContactShowFixtures = () => {
  cy.intercept('GET', 'http://localhost:8000/contact/1**', {
    statusCode: 200,
    body: contactOne,
  }).as('getContact')

  cy.intercept('GET', 'http://localhost:8000/thing/1**', {
    statusCode: 200,
    body: wellOne,
  }).as('getAssociatedWell')

  cy.intercept('GET', 'http://localhost:8000/observation/groundwater-level*', {
    statusCode: 200,
    body: listResponse([
      {
        id: 501,
        sample_id: 701,
        observation_datetime: '2026-03-01T10:00:00Z',
        depth_to_water_bgs: 42.5,
      },
    ]),
  }).as('getContactWellObservations')

  cy.intercept('GET', 'http://localhost:8000/sample/701**', {
    statusCode: 200,
    body: {
      id: 701,
      sample_date: '2026-03-01T10:00:00Z',
      sampler_name: 'Field Staff',
      contact: contactOne,
    },
  }).as('getContactWellSample')
}
