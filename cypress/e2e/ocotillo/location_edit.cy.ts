/// <reference types="cypress" />
import { zUpdateLocation } from '../../../src/generated/zod.gen'

describe('Location Edit Page', () => {
  beforeEach(() => {
    cy.fixture('location.json').then((locationData) => {
      cy.intercept('GET', '**/location/1**', {
        statusCode: 200,
        body: locationData,
      }).as('getLocation')
    })

    // Interceptor for the update location api call
    cy.intercept('PATCH', '**/location/1**', (req) => {
      const validationResult = zUpdateLocation.safeParse(req.body)

      if (!validationResult.success) {
        console.error('Validation failed:', validationResult.error)
        throw new Error(
          `Invalid payload: ${JSON.stringify(validationResult.error.issues)}`
        )
      }
      // Update location response
      req.reply({
        statusCode: 200,
        body: { id: 1, ...validationResult.data },
      })
    }).as('updateLocation')

    cy.login()
    cy.visit('/ocotillo/location/edit/1')
  })

  it('should render all required UI elements', () => {
    cy.contains(/edit location/i).should('exist')

    // Check coordinate system toggle
    cy.contains(
      'label',
      'Toggle between using Northing/Easting or Latitude/Longitude'
    ).should('exist')

    // Check coordinate input fields
    cy.contains('label', 'Latitude (decimal degrees)').should('exist')
    cy.contains('label', 'Longitude (decimal degrees)').should('exist')
    cy.contains('label', 'Coordinate Accuracy (ft)').should('exist')
    cy.contains('label', 'Coordinate Method').should('exist')

    // Check elevation fields
    cy.contains('label', 'Auto-generate elevation from USGS DEM').should(
      'exist'
    )
    cy.contains('label', 'Elevation (ft)').should('exist')
    cy.contains('label', 'Elevation Accuracy (ft)').should('exist')
    cy.contains('label', 'Elevation Method').should('exist')

    // Check other fields
    cy.contains('label', 'Release Status').should('exist')
    cy.contains('label', 'Notes').should('exist')
    cy.contains('label', 'WKT Point (Auto-generated)').should('exist')

    cy.get('button').contains(/save/i).should('exist')
  })

  it('should load existing location data', () => {
    // Check that existing data is loaded
    cy.contains('label', 'Latitude (decimal degrees)')
      .parent()
      .find('input')
      .should('have.value', '34.068279')
    cy.contains('label', 'Longitude (decimal degrees)')
      .parent()
      .find('input')
      .should('have.value', '-106.904192')
    cy.contains('label', 'Elevation (ft)')
      .parent()
      .find('input')
      .should('have.value', '5000')
    cy.contains('label', 'Elevation Accuracy (ft)')
      .parent()
      .find('input')
      .should('have.value', '1.74')
    cy.contains('label', 'Notes')
      .parent()
      .find('textarea')
      .first()
      .should('have.value', 'Existing test location')
  })

  it('should allow user to update only required fields and submit location', () => {
    cy.wait('@getLocation')

    // Clear and update coordinates
    cy.contains('label', 'Latitude (decimal degrees)')
      .parent()
      .find('input')
      .clear()
      .type('34.100000')
    cy.contains('label', 'Longitude (decimal degrees)')
      .parent()
      .find('input')
      .clear()
      .type('-106.900000')

    // Turn off auto-generate elevation to manually set elevation
    cy.contains('label', 'Auto-generate elevation from USGS DEM')
      .parent()
      .find('input[type="checkbox"]')
      .click()
    cy.contains('label', 'Elevation (ft)')
      .parent()
      .find('input')
      .clear()
      .type('5100')

    cy.contains('label', 'Elevation Accuracy (ft)')
      .parent()
      .find('input')
      .clear()
      .type('2.5')

    cy.contains('label', 'Elevation Method')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    cy.contains('label', 'Release Status')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    cy.wait(3000) // wait for elevation DEM to load

    cy.get('button').contains(/save/i).click()

    // intercept
    cy.wait('@updateLocation').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200)
    })

    cy.contains(/success|updated|saved|submitted successfully/i, {
      timeout: 10000,
    }).should('exist')
  })

  it('should allow user to update all fields and submit location', () => {
    cy.wait('@getLocation')

    // Update coordinates
    cy.contains('label', 'Latitude (decimal degrees)')
      .parent()
      .find('input')
      .clear()
      .type('34.100000')
    cy.contains('label', 'Longitude (decimal degrees)')
      .parent()
      .find('input')
      .clear()
      .type('-106.900000')

    // coordinate fields
    cy.contains('label', 'Coordinate Accuracy (ft)')
      .parent()
      .find('input')
      .clear()
      .type('15')
    cy.contains('label', 'Coordinate Method')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    // Turn off auto-generate elevation to manually set elevation
    cy.contains('label', 'Auto-generate elevation from USGS DEM')
      .parent()
      .find('input[type="checkbox"]')
      .click()
    cy.contains('label', 'Elevation (ft)')
      .parent()
      .find('input')
      .clear()
      .type('5100')
    cy.contains('label', 'Elevation Accuracy (ft)')
      .parent()
      .find('input')
      .clear()
      .type('2.5')

    cy.contains('label', 'Elevation Method')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    cy.contains('label', 'Release Status')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    // notes field
    cy.contains('label', 'Notes')
      .parent()
      .find('textarea')
      .first()
      .clear()
      .type('Updated test location for automated testing')

    cy.get('button').contains(/save/i).click()

    // intercept
    cy.wait('@updateLocation').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200)
    })

    cy.contains(/success|updated|saved|submitted successfully/i, {
      timeout: 10000,
    }).should('exist')
  })

  it('should allow user to use UTM coordinates instead of lat/long', () => {
    cy.wait('@getLocation')

    // toggle to UTM mode
    cy.contains(
      'label',
      'Toggle between using Northing/Easting or Latitude/Longitude'
    )
      .parent()
      .find('input[type="checkbox"]')
      .click()

    // keep utm zone default for now
    cy.contains('label', 'Easting (UTM X)')
      .parent()
      .find('input')
      .clear()
      .type('350100')
    cy.contains('label', 'Northing (UTM Y)')
      .parent()
      .find('input')
      .clear()
      .type('3870100')

    cy.contains('label', 'Coordinate Accuracy (ft)')
      .parent()
      .find('input')
      .clear()
      .type('15')
    cy.contains('label', 'Coordinate Method')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    cy.contains('label', 'Elevation Method')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    cy.contains('label', 'Release Status')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="listbox"] li').first().click()

    cy.get('button').contains(/save/i).click()

    // intercept
    cy.wait('@updateLocation').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200)
    })

    cy.contains(/success|updated|saved|submitted successfully/i, {
      timeout: 10000,
    }).should('exist')
  })
})
