/// <reference types="cypress" />

export {}

// custom login to mock token
Cypress.Commands.add('login', () => {
  // clear any auth state
  cy.clearLocalStorage()
  
  // set tokens to mock token
  cy.window().then((win) => {
    win.localStorage.setItem('access_token', 'fake_token')
    win.localStorage.setItem('id_token', 'fake_token')
    win.localStorage.setItem('refresh_token', 'fake_refresh_token')
  })
  
})

// custom Logout
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('access_token')
    win.localStorage.removeItem('id_token')
    win.localStorage.removeItem('refresh_token')
    win.localStorage.removeItem('pkce_code_verifier')
  })
})

// TypeScript declarations
declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      logout(): Chainable<void>
    }
  }
}