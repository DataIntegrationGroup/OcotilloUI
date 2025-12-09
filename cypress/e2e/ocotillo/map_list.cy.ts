/// <reference types="cypress" />

describe('Map Page', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/ocotillo/map')
  })

  it('should render the map page UI without errors', () => {
    cy.get('canvas.mapboxgl-canvas', { timeout: 20000 }).should('be.visible')
    cy.get('[data-testid="ocotillo-map-container"]').should('exist')
  })
})
