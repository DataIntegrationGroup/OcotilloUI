/// <reference types="cypress" />

import {
  contactOne,
  interceptWellShowFixtures,
  projectAlpha,
  wellOne,
} from '../../support/ocotillo-fixtures'

describe('Thing Well Show Page', () => {
  beforeEach(() => {
    interceptWellShowFixtures()
    cy.login()
    cy.visit('/ocotillo/well/show/1')
    cy.wait('@getWellDetails')
  })

  it('renders the current well detail UI with core cards and related data', () => {
    cy.contains('h3', wellOne.name).should('be.visible')
    cy.contains(wellOne.site_name).should('exist')
    cy.contains(wellOne.monitoring_status).should('exist')
    cy.contains(wellOne.well_status).should('exist')

    cy.contains('Hole Depth').should('be.visible')
    cy.contains('210 ft').should('be.visible')
    cy.contains('Well Depth').should('be.visible')
    cy.contains('198 ft').should('be.visible')
    cy.contains('Measuring Point').should('be.visible')
    cy.contains('Top of casing | 2.5 ft').should('be.visible')

    cy.get('[data-testid="ocotillo-map-container"]', {
      timeout: 20000,
    }).should('exist')
    cy.contains('Hydrograph').should('exist')
    cy.contains('Recent Water Level Observations').should('exist')
    cy.contains('Alternate IDs').should('exist')

    cy.contains(contactOne.name).should('exist')
    cy.contains(contactOne.organization).should('exist')
    cy.contains(contactOne.emails[0].email).should('exist')
    cy.contains(projectAlpha.name.toUpperCase()).should('exist')
  })
})
