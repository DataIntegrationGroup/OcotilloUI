/// <reference types="cypress" />

describe('Thing Well Show Page', () => {
  beforeEach(() => {
    cy.login()

    cy.intercept('GET', '**/thing/107').as('getWell')
    cy.visit('/ocotillo/well/show/107')
    cy.wait('@getWell')
  })

  it('should render the map page UI without errors', () => {
    cy.get('canvas.mapboxgl-canvas', { timeout: 20000 }).should('be.visible')
    cy.get('[data-testid="ocotillo-map-container"]').should('exist')
  })
})
