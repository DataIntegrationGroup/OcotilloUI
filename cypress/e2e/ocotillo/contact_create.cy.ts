/// <reference types="cypress" />
describe('Contact Create Page', () => {
  beforeEach(() => {
    cy.visit('/ocotillo/contact/create');
  });

  it('should render all required UI elements', () => {
    cy.contains(/create contact/i).should('exist');
    cy.get('input[aria-label="Contact Name"]').should('exist');
    cy.get('input[aria-label="Organization"]').should('exist');
    cy.get('input[aria-label="Contact Type"]').should('exist');
    cy.get('input[aria-label="Thing"]').should('exist');
    cy.get('input[aria-label="Release Status"]').should('exist');
    cy.get('input[aria-label="Contact Role"]').should('exist');
    cy.get('button').contains(/save/i).should('exist');
  });

  it('should allow user to fill out and submit the form', () => {
    // Fill text inputs
    cy.get('input[aria-label="Contact Name"]').type('Test User');
    cy.get('input[aria-label="Organization"]').type('Test Organization');

    // Select thing from autocomplete
    cy.get('input[aria-label="Thing"]').click().type('Test');
    cy.contains('Test Thing 1').click();

    // Select from lexicon dropdowns
    cy.get('input[aria-label="Release Status"]').click();
    cy.contains('Public').click();

    cy.get('input[aria-label="Contact Role"]').click();
    cy.contains('Owner').click();

    cy.get('input[aria-label="Contact Type"]').click();
    cy.contains('Primary').click();

    // Submit the form
    cy.get('button').contains(/save/i).click();

    // Assert success
    cy.contains(/success|created|saved|submitted successfully/i, { timeout: 10000 }).should('exist');
  });
});