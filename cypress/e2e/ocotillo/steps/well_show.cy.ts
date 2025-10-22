/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { zWellResponse } from '../../../../src/generated/zod.gen';

Given('I open the Well Detail Page for well "{word}"', (wellId: string) => {
    cy.login();
    cy.visit(`/ocotillo/well/show/${encodeURIComponent(wellId)}`);
    cy.intercept('GET', `/thing/${encodeURIComponent(wellId)}`).as('getWaterwell');
});

Then('It should show all well response elements', () => {
    cy.wait('@getWaterwell').then((interception) => {
        const body = interception?.response?.body;
        try {
            zWellResponse.parse(body);
        } catch (error) {
            console.error('Zod validation failed:', error);
            throw error;
        }
    });
});

// Better element-specific assertions based on actual component structure
Then('I see the header Show Well', () => {
    cy.get('.refine-pageHeader-title')
        .should('contain.text', 'Show Well')
        .should('be.visible');
});

Then("I see the Map", () => {
    // Look for the InteractiveSatelliteMapCard component
    cy.get('.MuiCard-root')
        .contains('Map')
        .should('be.visible');
});

Then("I see the Hydrograph", () => {
    cy.get('.MuiCard-root')
        .contains('Hydrograph')
        .should('be.visible');
});

Then("I see the Recent Water Level Observations", () => {
    cy.get('.MuiCard-root')
        .contains('Recent Water Level Observations')
        .should('be.visible');
});

Then("I see the Contacts section", () => {
    cy.get('.MuiAccordion-root')
        .contains('Contacts')
        .should('be.visible');
});

Then("I see the Equipment section", () => {
    cy.get('.MuiCard-root')
        .contains('Equipment')
        .should('be.visible');
});

Then("I see the Well Screens section", () => {
    cy.get('.MuiCard-root')
        .contains('Well Screens')
        .should('be.visible');
});

Then("I see the Attachments section", () => {
    cy.get('.MuiAccordion-root')
        .contains('Attachments')
        .should('be.visible');
});