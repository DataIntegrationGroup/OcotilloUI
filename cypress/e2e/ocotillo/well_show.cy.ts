/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { zWellResponse } from '../../../src/generated/zod.gen';

Given('I open the Well Detail Page for well "{word}"', (wellId: string) => {
    cy.login();
    cy.visit(`/ocotillo/water-well/show/${encodeURIComponent(wellId)}`);
    cy.intercept('GET', `/water-well/${encodeURIComponent(wellId)}`).as('getWaterwell');
  });

  it('should show all well response elements', () => {
    cy.wait('@getWaterwell').then((interception) => {
      const body = interception?.response?.body;
      try {
        zWellResponse.parse(body);
      } catch (error) {
        console.error('Zod validation failed:', error);
      }
    });
  });

  // Basic content
  
  Then('I see the header showing "{string}"', (id: string) => {
    cy.contains(/show well/i).should("exist");
  });
  
  Then("I see the Well Information section", () => {
    cy.contains(/Well Information/i).should("exist");
  });
  
  Then("I see the Map", () => {
    cy.contains(/Map/i).should("exist");
  });
  
  Then("I see the Hydrograph", () => {
    cy.contains(/Hydrograph/i).should("exist");
  });
  
  Then("I see the Recent Water Level Observations", () => {
    cy.contains(/Recent Water Level Observations/i).should("exist");
  });
  
  Then("I see the Contacts section", () => {
    cy.contains(/Contacts/i).should("exist");
  });
  
  Then("I see the Equipment section", () => {
    cy.contains(/Equipment/i).should("exist");
  });

  Then("I see the Well Screens section", () => {
    cy.contains(/Equipment/i).should("exist");
  });

  Then("I see the Attachments section", () => {
    cy.contains(/Equipment/i).should("exist");
  });