/// <reference types="cypress" />

import {
  interceptOcotilloListFixtures,
  projectAlpha,
  projectBeta,
  wellOne,
  wellTwo,
} from '../../support/ocotillo-fixtures'

describe('Ocotillo List Pages', () => {
  beforeEach(() => {
    cy.viewport(1600, 900)
    interceptOcotilloListFixtures()
    cy.login()
  })

  it('renders the wells list with search, actions, columns, and rows', () => {
    cy.visit('/ocotillo/well')
    cy.wait('@getWells')

    cy.contains('h3', /^Wells$/).should('be.visible')
    cy.get('input[aria-label="Search wells by well name"]').should(
      'have.attr',
      'placeholder',
      'Search by well name'
    )
    cy.get('button')
      .contains(/batch field sheets/i)
      .should('be.visible')
    cy.get('button')
      .contains(/export/i)
      .should('be.visible')

    cy.contains('[role="columnheader"]', 'Name').should('be.visible')
    cy.contains('[role="columnheader"]', 'Site name').should('be.visible')
    cy.contains('[role="columnheader"]', 'Monitoring').should('be.visible')
    cy.contains('[role="columnheader"]', 'Well Status').should('be.visible')

    cy.contains('[role="row"]', wellOne.name).should('be.visible')
    cy.contains('[role="row"]', wellTwo.name).should('be.visible')
    cy.contains(projectAlpha.name).should('be.visible')
  })

  it('renders the project list with project rows and navigation targets', () => {
    cy.visit('/ocotillo/well/projects')
    cy.wait('@getProjects')

    cy.contains('h3', /^Projects$/).should('be.visible')
    cy.get('input[aria-label="Filter rows on this page"]').should(
      'have.attr',
      'placeholder',
      'Filter this page...'
    )

    cy.contains('[role="columnheader"]', 'Name').should('be.visible')
    cy.contains('[role="columnheader"]', 'Description').should('be.visible')
    cy.contains('[role="columnheader"]', 'Release Status').should('be.visible')
    cy.contains('[role="columnheader"]', 'Type').should('be.visible')

    cy.contains('[role="row"]', projectAlpha.name).should('be.visible')
    cy.contains('[role="row"]', projectBeta.name).should('be.visible')
    cy.contains(projectAlpha.description).should('be.visible')
  })

  it('renders the contacts list with contact method and associated site columns', () => {
    cy.visit('/ocotillo/contact')
    cy.wait('@getContacts')

    cy.contains('h3', /contacts & owners/i).should('be.visible')
    cy.get('input[aria-label="Filter rows on this page"]').should('be.visible')

    cy.contains('[role="columnheader"]', 'Name').should('be.visible')
    cy.contains('[role="columnheader"]', 'Organization').should('be.visible')
    cy.contains('[role="columnheader"]', 'Role').should('be.visible')
    cy.contains('[role="columnheader"]', 'Contact Type').should('be.visible')
    cy.contains('[role="columnheader"]', 'Associated Sites').should(
      'be.visible'
    )

    cy.contains('[role="row"]', 'Alex Contact').should('be.visible')
    cy.contains('[role="row"]', 'Jordan Manager').should('be.visible')
    cy.contains(wellOne.name).should('be.visible')
  })
})
