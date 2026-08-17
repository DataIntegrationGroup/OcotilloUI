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

    // Native table semantics: the shadcn table renders th/tr rather than the
    // DataGrid's explicit role attributes.
    cy.contains('th', 'Name').should('be.visible')
    cy.contains('th', 'Site name').should('be.visible')
    cy.contains('th', 'Monitoring').should('be.visible')
    cy.contains('th', 'Well Status').should('be.visible')

    cy.contains('tr', wellOne.name).should('be.visible')
    cy.contains('tr', wellTwo.name).should('be.visible')
    cy.contains(projectAlpha.name).should('be.visible')
  })

  it('renders the project list with project rows and navigation targets', () => {
    cy.visit('/ocotillo/projects')
    cy.wait('@getProjects')

    cy.contains('h3', /^Projects$/).should('be.visible')
    cy.get('input[aria-label="Search projects"]').should(
      'have.attr',
      'placeholder',
      'Search projects…'
    )

    // Native table semantics: the shadcn table renders th/tr rather than the
    // DataGrid's explicit role attributes.
    cy.contains('th', 'Name').should('be.visible')
    cy.contains('th', 'Description').should('be.visible')
    cy.contains('th', 'Release Status').should('be.visible')
    cy.contains('th', 'Type').should('be.visible')

    cy.contains('tr', projectAlpha.name).should('be.visible')
    cy.contains('tr', projectBeta.name).should('be.visible')
    cy.contains(projectAlpha.description).should('be.visible')
  })

  it('renders the contacts list with contact method and associated site columns', () => {
    cy.visit('/ocotillo/contact')
    cy.wait('@getContacts')

    cy.contains('h3', /contacts & owners/i).should('be.visible')

    cy.contains('th', 'Name').should('be.visible')
    cy.contains('th', 'Organization').should('be.visible')
    cy.contains('th', 'Role').should('be.visible')
    cy.contains('th', 'Contact Type').should('be.visible')
    cy.contains('th', 'Associated Sites').should('be.visible')

    cy.contains('tr', 'Alex Contact').should('be.visible')
    cy.contains('tr', 'Jordan Manager').should('be.visible')
    cy.contains(wellOne.name).should('be.visible')
  })
})
