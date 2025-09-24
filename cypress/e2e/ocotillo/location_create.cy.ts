/// <reference types="cypress" />
import { zCreateLocation } from '../../../src/generated/zod.gen';

describe('Location Create Page', () => {
  beforeEach(() => {
    // Interceptor for the create location api call
    cy.intercept('POST', '**/location**', (req) => {
      const validationResult = zCreateLocation.safeParse(req.body);

      if (!validationResult.success) {
        console.error('Validation failed:', validationResult.error);
        throw new Error(`Invalid payload: ${JSON.stringify(validationResult.error.issues)}`);
      }
      // Create location response
      req.reply({
        statusCode: 201,
        body: { id: 1, ...validationResult.data }
      });
    }).as('createLocation');

    cy.login();
    cy.visit('/ocotillo/location/create');
  });

  it('should render all required UI elements', () => {
    cy.contains(/create location/i).should('exist');
    
    // Check coordinate system toggle
    cy.contains('label', 'Toggle between using Northing/Easting or Latitude/Longitude').should('exist');
    
    // Check coordinate input fields
    cy.contains('label', 'Latitude (decimal degrees)').should('exist');
    cy.contains('label', 'Longitude (decimal degrees)').should('exist');
    cy.contains('label', 'Coordinate Accuracy (ft)').should('exist');
    cy.contains('label', 'Coordinate Method').should('exist');
    
    // Check elevation fields
    cy.contains('label', 'Auto-generate elevation from USGS DEM').should('exist');
    cy.contains('label', 'Elevation (ft)').should('exist');
    cy.contains('label', 'Elevation Accuracy (ft)').should('exist');
    cy.contains('label', 'Elevation Method').should('exist');
    
    // Check other fields
    cy.contains('label', 'Release Status').should('exist');
    cy.contains('label', 'Notes').should('exist');
    cy.contains('label', 'WKT Point (Auto-generated)').should('exist');
    
    // Come back to testing the map
    
    cy.get('button').contains(/save/i).should('exist');
  });

  it('should allow user to fill out only required fields and submit location', () => {
   
    cy.contains('label', 'Latitude (decimal degrees)').parent().find('input').type('34.068279');
    cy.contains('label', 'Longitude (decimal degrees)').parent().find('input').type('-106.904192');

    cy.wait(3000); // wait for elevation DEM to load

    cy.get('button').contains(/save/i).click();

    // intercept
    cy.wait('@createLocation').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.contains(/success|created|saved|submitted successfully/i, { timeout: 10000 }).should('exist');
  });

  it('should allow user to fill out all fields and submit location', () => {
  
    cy.contains('label', 'Latitude (decimal degrees)').parent().find('input').type('34.068279');
    cy.contains('label', 'Longitude (decimal degrees)').parent().find('input').type('-106.904192');
    
    // coordinate fields
    cy.contains('label', 'Coordinate Accuracy (ft)').parent().find('input').type('10');
    cy.contains('label', 'Coordinate Method').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    
    // Turn off auto-generate elevation to manually set elevation
    cy.contains('label', 'Auto-generate elevation from USGS DEM').parent().find('input[type="checkbox"]').click();
    cy.contains('label', 'Elevation (ft)').parent().find('input').type('5000');
    cy.contains('label', 'Elevation Accuracy (ft)').parent().find('input').type('1.74');
    cy.contains('label', 'Elevation Method').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    
    // notes field
    cy.contains('label', 'Notes').parent().find('textarea').first().type('Test location for automated testing');

    cy.get('button').contains(/save/i).click();

    // intercept
    cy.wait('@createLocation').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.contains(/success|created|saved|submitted successfully/i, { timeout: 10000 }).should('exist');
  });

  it('should allow user to use UTM coordinates instead of lat/long', () => {
    // toggle to UTM mode
    cy.contains('label', 'Toggle between using Northing/Easting or Latitude/Longitude').parent().find('input[type="checkbox"]').click();
    
    // keep utm zone default for now
    cy.contains('label', 'Easting (UTM X)').parent().find('input').type('350000');
    cy.contains('label', 'Northing (UTM Y)').parent().find('input').type('3870000');
    
    cy.contains('label', 'Coordinate Accuracy (ft)').parent().find('input').type('10');
    cy.contains('label', 'Coordinate Method').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    
    cy.contains('label', 'Elevation Method').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();
    
    cy.contains('label', 'Release Status').parent().find('[role="combobox"]').click();
    cy.get('[role="listbox"] li').first().click();

    cy.get('button').contains(/save/i).click();

    // intercept
    cy.wait('@createLocation').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.contains(/success|created|saved|submitted successfully/i, { timeout: 10000 }).should('exist');
  });
});