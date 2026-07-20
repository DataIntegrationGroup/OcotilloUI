/// <reference types="cypress" />

import {
  contactOne,
  interceptContactShowFixtures,
  interceptProjectShowFixtures,
  projectAlpha,
  wellOne,
  wellTwo,
} from '../../support/ocotillo-fixtures'

describe('Ocotillo Show Pages', () => {
  it('renders the project show page with details, map, and associated wells', () => {
    interceptProjectShowFixtures()
    cy.login()
    cy.visit('/ocotillo/well/projects/show/10')
    cy.wait('@getProject')

    cy.contains('h3', projectAlpha.name).should('be.visible')
    cy.contains(projectAlpha.group_type).should('be.visible')
    cy.contains('Project Details').should('be.visible')
    cy.contains('Project Details')
      .closest('[class*="MuiPaper-root"]')
      .within(() => {
        cy.contains('Release Status').should('be.visible')
        cy.contains(projectAlpha.release_status).should('be.visible')
      })
    cy.contains(projectAlpha.description).should('be.visible')
    cy.contains('Created By').should('be.visible')
    cy.contains(projectAlpha.created_by_name).should('be.visible')

    cy.contains('Project Map').should('be.visible')
    cy.get('[data-testid="ocotillo-map-container"]', {
      timeout: 20000,
    }).should('exist')
    cy.contains('Associated Wells').scrollIntoView().should('be.visible')
    cy.get('a')
      .contains('View all 2 wells')
      .should('have.attr', 'href')
      .and('include', '/ocotillo/well?projectId=10')
    cy.contains('[role="row"]', wellOne.name).should('be.visible')
    cy.contains('[role="row"]', wellTwo.name).should('be.visible')
  })

  it('renders the contact show page with details and associated sites', () => {
    interceptContactShowFixtures()
    cy.login()
    cy.visit('/ocotillo/contact/show/1')
    cy.wait('@getContact')

    cy.contains('h3', contactOne.name).should('be.visible')
    cy.contains(contactOne.role).should('be.visible')
    cy.contains(contactOne.organization).should('be.visible')
    cy.contains('Contact Details').should('be.visible')
    cy.contains(contactOne.emails[0].email).should('be.visible')
    cy.contains('(505) 555-1212').should('be.visible')
    cy.contains('801 Leroy Place').should('be.visible')

    cy.contains('Associated Sites').should('be.visible')
    cy.contains(wellOne.name).should('be.visible')
    cy.contains('Depth to water').should('be.visible')
    cy.contains('42.5 ft bgs').should('be.visible')
    cy.contains('Associated Sites Map').should('be.visible')
  })
})
