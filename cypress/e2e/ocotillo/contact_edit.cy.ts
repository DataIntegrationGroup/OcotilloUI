/// <reference types="cypress" />
import { zUpdateContact } from '../../../src/generated/zod.gen';

describe('Contact Edit Page', () => {
  beforeEach(() => {

//THIS TEST ONLY TESTS THE REQUIRED FIELDS of "Contact" - NO EMAIL, PHONE, OR ADDRESS FIELDS IN UPDATE CONTACT

    // Interceptor for the update contact api call
    cy.intercept('PATCH', '**/contact/1**', (req) => {
      const validationResult = zUpdateContact.safeParse(req.body);

      if (!validationResult.success) {
        console.error('Validation failed:', validationResult.error);
        throw new Error(`Invalid payload: ${JSON.stringify(validationResult.error.issues)}`);
      }
      // Update contact response
      req.reply({
        statusCode: 200,
        body: { id: 1, ...validationResult.data }
      });
    }).as('updateContact');

    cy.login();
    cy.visit('/ocotillo/contact/edit/1');
  });

  it('should render all required UI elements', () => {
    cy.contains(/edit contact/i).should('exist');
    
    cy.get('input').should('have.length.at.least', 1); 
    cy.contains('label', 'Contact Name').should('exist');
    cy.contains('label', 'Organization').should('exist');
    cy.contains('label', 'Contact Role').should('exist');
    cy.contains('label', 'Release Status').should('exist');
    cy.contains('label', 'Contact Type').should('exist');
    cy.contains('label', 'Thing').should('exist');
    cy.get('button').contains(/save/i).should('exist');
  });

  it('should allow user to edit only required fields and submit contact', () => {

    // Clear and update text inputs
    cy.contains('label', 'Contact Name').parent().find('input').clear().type('Updated Contact Name');
    cy.contains('label', 'Organization').parent().find('input').clear().type('Updated Organization');

    // Update thing from autocomplete
    cy.contains('label', 'Thing').parent().find('input').click();
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"] li').first().click();

    // Update lexicon dropdowns
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Contact Role').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Contact Type').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();

    cy.wait(5000); // wait for save button to be enabled

    cy.get('button').contains(/save/i).click();

    // Wait for the update contact api call to complete
    cy.wait('@updateContact').then((interception) => {
      // Check the response status code
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.contains(/success|updated|saved|submitted successfully/i, { timeout: 10000 }).should('exist');
  });

});
