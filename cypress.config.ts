import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },

  e2e: {
    excludeSpecPattern: ['**/login.cy.ts'],
    baseUrl: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    setupNodeEvents(_, config) {
      return config
    },
    env: {
      // These are Cypress variables, accessible with Cypress.env(...)
      NODE_ENV: 'test',
    },
  },
})
