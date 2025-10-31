/// <reference types="cypress" />
import { zCreateContact } from '../../../src/generated/zod.gen';

describe('Contact Create Page', () => {
  beforeEach(() => {

    // interceptor for the create contact api call
    cy.intercept('POST', '**/contact**', (req) => {
      const validationResult = zCreateContact.safeParse(req.body);

      if (!validationResult.success) {
        console.error('Validation failed:', validationResult.error);
        throw new Error(`Invalid payload: ${JSON.stringify(validationResult.error.issues)}`);
      }
      //create contact response
      req.reply({
        statusCode: 201,
        body: { id: 1, ...validationResult.data }
      });
    }).as('createContact');

    cy.login();
    cy.visit('/ocotillo/contact/create');
  });

  it('should render all required UI elements', () => {
    cy.contains(/create contact/i).should('exist');
    
    cy.get('input').should('have.length.at.least', 1); 
    cy.contains('label', 'Contact Name').should('exist');
    cy.contains('label', 'Organization').should('exist');
    cy.contains('label', 'Contact Role').should('exist');
    cy.contains('label', 'Release Status').should('exist');
    cy.contains('label', 'Contact Type').should('exist');
    cy.contains('label', 'Thing').should('exist');
    cy.get('button').contains(/save/i).should('exist');
  });

  it('should allow user to fill out only required fields and submit contact', () => {
    // text inputs
    cy.contains('label', 'Contact Name').parent().find('input').type('Test User');
    cy.contains('label', 'Organization').parent().find('input').type('Test Organization');

    // thing from autocomplete
    cy.contains('label', 'Thing').parent().find('input').type('TEST')
    // Wait for the API call to complete
    cy.wait(500)
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"] li').first().click();

    // lexicon dropdowns
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Contact Role').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Contact Type').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();

    cy.get('button').contains(/save/i).click();

    // wait for the create contact api call to complete
    cy.wait('@createContact').then((interception) => {
      // check the response status code
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.contains(/success|created|saved|submitted successfully/i, { timeout: 10000 }).should('exist');
  });

  it('should allow user to fill out all fields with emails, phones, and addresses and submit contact', () => {
    // text inputs
    cy.contains('label', 'Contact Name').parent().find('input').type('Test User');
    cy.contains('label', 'Organization').parent().find('input').type('Test Organization');

    // thing from autocomplete
    cy.contains('label', 'Thing').parent().find('input').type('TEST')
    // Wait for the API call to complete
    cy.wait(500)
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"] li').first().click();

    // lexicon dropdowns
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Contact Role').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Contact Type').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();

    // add email
    cy.get('button').contains(/add email/i).click();
    cy.contains('label', 'Email Address').parent().find('input').type('test@test.com');
    cy.contains('label', 'Email Type').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();

    // add phone
    cy.get('button').contains(/add phone/i).click();
    cy.contains('label', 'Phone Number').parent().find('input').type('1234567890');
    cy.contains('label', 'Phone Type').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();

    // add address
    cy.get('button').contains(/add address/i).click();
    cy.contains('label', 'Address Line 1').parent().find('input').type('123 Main St');
    cy.contains('label', 'Address Line 2').parent().find('input').type('Apt 1');
    cy.contains('label', 'Address Type').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    cy.contains('label', 'City').parent().find('input').type('Test City');
    cy.contains('label', 'State').parent().find('input').type('Test State');
    cy.contains('label', 'Postal Code').parent().find('input').type('12345');

    cy.get('button').contains(/save/i).click();

    // wait for the create contact api call to complete
    cy.wait('@createContact').then((interception) => {
      // check the response status code
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.contains(/success|created|saved|submitted successfully/i, { timeout: 10000 }).should('exist');
  });
});