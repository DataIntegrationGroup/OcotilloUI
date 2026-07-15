/// <reference types="cypress" />
import { zUpdateContact } from '../../../src/generated/zod.gen'

const contact = {
  id: 1,
  name: 'Original Contact Name',
  organization: 'NMBGMR',
  role: 'Owner',
  contact_type: 'Primary',
  release_status: 'public',
  created_at: '2026-01-01T00:00:00Z',
  things: [],
  phones: [],
  emails: [],
  addresses: [],
}

const lexiconItems = (values: string[]) => ({
  items: values.map((value, index) => ({
    id: index + 1,
    term: value,
    definition: value,
    release_status: 'public',
  })),
  total: values.length,
})

const lexiconByCategory: Record<string, string[]> = {
  role: ['Owner', 'Manager'],
  contact_type: ['Primary', 'Secondary'],
  organization: ['NMBGMR', 'Bureau of Geology'],
  email_type: ['Primary', 'Work'],
  phone_type: ['Primary', 'Mobile'],
  address_type: ['Mailing', 'Physical'],
}

describe('Contact Edit Panel', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/contact/1**', {
      statusCode: 200,
      body: contact,
    }).as('getContact')

    cy.intercept('GET', '**/lexicon/term**', (req) => {
      const category = String(req.query.category ?? '')
      req.reply({
        statusCode: 200,
        body: lexiconItems(lexiconByCategory[category] ?? []),
      })
    }).as('getLexiconTerms')

    // Interceptor for the update contact api call
    cy.intercept('PATCH', '**/contact/1**', (req) => {
      const validationResult = zUpdateContact.safeParse(req.body)

      if (!validationResult.success) {
        console.error('Validation failed:', validationResult.error)
        throw new Error(
          `Invalid payload: ${JSON.stringify(validationResult.error.issues)}`
        )
      }
      // Update contact response
      req.reply({
        statusCode: 200,
        body: { ...contact, ...validationResult.data },
      })
    }).as('updateContact')

    cy.login()
    cy.visit('/ocotillo/contact/show/1')
    cy.wait('@getContact')
    cy.get('button').contains(/^edit$/i).click()
    cy.wait('@getLexiconTerms')
  })

  it('should render the current edit panel fields', () => {
    cy.contains(/edit: original contact name/i).should('be.visible')
    cy.contains(/contact details/i).should('be.visible')

    cy.contains('label', 'Contact Type').should('exist')
    cy.contains('label', 'Role').should('exist')
    cy.contains('label', 'Name').should('exist')
    cy.contains('label', 'Organization').should('exist')
    cy.get('button').contains(/^save$/i).should('exist')
  })

  it('should allow user to edit core contact details and submit', () => {
    // Clear and update text inputs
    cy.contains('label', 'Name')
      .parent()
      .find('input')
      .clear()
      .type('Updated Contact Name')

    // Update lexicon dropdowns
    cy.contains('label', 'Role').parent().find('[role="combobox"]').click()
    cy.get('[role="option"]').contains('Manager').click()
    cy.contains('label', 'Contact Type')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.get('[role="option"]').contains('Secondary').click()

    cy.get('button').contains(/^save$/i).click()

    // Wait for the update contact api call to complete
    cy.wait('@updateContact').then((interception) => {
      // Check the response status code
      expect(interception.response?.statusCode).to.eq(200)
      expect(interception.request.body).to.deep.equal({
        name: 'Updated Contact Name',
        role: 'Manager',
        contact_type: 'Secondary',
      })
    })

    cy.contains(/edit: original contact name/i).should('not.exist')
  })
})
