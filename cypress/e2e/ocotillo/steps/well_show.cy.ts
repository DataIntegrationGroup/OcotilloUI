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

Then('I see the header Show Well', () => {
    cy.get('.refine-pageHeader-title')
        .should('contain.text', 'Show Well')
        .should('be.visible');
});

Then("I see the Map", () => {
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

// Well Information assertions
//Chips will have random text in test environment
Then("I should see the well name or point ID", () => {
    cy.get('.MuiChip-label')
        .should('be.visible');
});
Then("I should see the well purpose", () => {
    cy.get('.MuiChip-label')
        .should('be.visible');
});
Then("I should see the release status", () => {
    cy.get('.MuiChip-label')
        .should('be.visible');
});
Then("I should see the hole depth", () => {
    cy.get('.MuiTypography-root')
        .contains('Hole Depth:')
        .should('be.visible');
});
Then("I should see the well depth", () => {
    cy.get('.MuiTypography-root')
        .contains('Well Depth:')
        .should('be.visible');
});
Then("I should see the coordinates", () => {
    cy.get('.MuiTypography-root')
        .contains('Northing/Easting:')
        .should('be.visible');
});
Then("I should see the elevation", () => {
    cy.get('.MuiTypography-root')
        .contains('Elevation:')
        .should('be.visible');
});
Then("I should see the alternate IDs", () => {
    cy.get('.MuiTypography-root')
        .contains('Alternate IDs')
        .should('be.visible');
});

//Map section assertions
Then("I should see the interactive satellite map", () => {
    cy.get('.MuiCard-root')
        .contains('Map')
        .should('be.visible');
});

//Hydrograph and Recent Water Level Observations section assertions
Then("I should see the hydrograph visualization", () => {
    cy.get('.MuiCard-root')
        .contains('Hydrograph')
        .should('be.visible');
});
Then("I should see the recent water level observations table", () => {
    cy.get('.MuiCard-root')
        .contains('Recent Water Level Observations')
        .should('be.visible');
});

//Contacts section assertions
Then("I should see the contacts table", () => {
    cy.get('.MuiAccordion-root')
        .contains('Contacts')
        .should('exist');
});

Then("the table should show contact names", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Name')
        .should('exist');
});
Then("the table should show contact roles", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Role')
        .should('exist');
});
Then("the table should show contact types", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Contact Type')
        .should('exist');
});
Then("the table should show email addresses", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Email')
        .should('exist');
});
Then("the table should show phone numbers", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Phone')
        .should('exist');
});
Then("I should see the create contact button", () => {
    cy.get('.MuiButton-root')
        .contains('Create')
        .should('exist');
});

//Equipment Section assertions
Then("I should see the equipment table", () => {
    cy.get('.MuiCard-root')
        .contains('Equipment')
        .should('exist');
});
Then("I should see the create equipment button", () => {
    cy.get('.MuiButton-root')
        .contains('Create')
        .should('exist');
});

Then("the table should show equipment names", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Name')
        .should('exist');
});
Then("the table should show equipment models", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Model')
        .should('exist');
});
Then("the table should show serial numbers", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Serial No')
        .should('exist');
});
Then("the table should show installation dates", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Date Installed')
        .should('exist');
});
Then("the table should show removal dates", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Date Removed')
        .should('exist');
});
Then("the table should show recording intervals", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Recording Interval')
        .should('exist');
});
Then("the table should show equipment notes", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Notes')
        .should('exist');
});

//Well Screens Section assertions
Then("I should see the well screens table", () => {
    cy.get('.MuiCard-root')
        .contains('Well Screens')
        .should('exist');
});
Then("I should see the create well screen button", () => {
    cy.get('.MuiButton-root')
        .contains('Create')
        .should('exist');
});
Then("the table should show screen types", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Screen Type')
        .should('exist');
});
Then("the table should show screen top depths", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Screen Top Depth (ft)')
        .should('exist');
});
Then("the table should show screen bottom depths", () => {
    cy.get('.MuiDataGrid-columnHeaderTitle')
        .contains('Screen Bottom Depth (ft)')
        .should('exist');
});

//Attachments Section assertions
Then("I should see the attachments section", () => {
    cy.get('.MuiAccordion-root')
        .contains('Attachments')
        .should('be.visible');
});