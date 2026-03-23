/// <reference types="cypress" />

describe('Thing Well Show Page', () => {
  beforeEach(() => {
    cy.login()

    cy.intercept('GET', '**/thing/*').as('getWell')
    cy.visit('/ocotillo/well/show/1')
    cy.wait('@getWell')
  })

  it('should render the well show page UI without errors', () => {
    cy.get('[data-testid="ocotillo-map-container"]', { timeout: 20000 }).should(
      'exist'
    )
  })
})
