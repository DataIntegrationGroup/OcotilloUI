import { defineConfig } from "cypress";

const cucumber = require("cypress-cucumber-preprocessor").default;

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },

  e2e: {
    baseUrl: 'http://localhost:4173',
    specPattern: "**/*.feature",
    setupNodeEvents(on, config) {
      on("file:preprocessor", cucumber())
      process.env.NODE_ENV = 'test'
    },
    env: {
      // set test auth variable to true to mock Authentik provider token
      VITE_TEST_AUTH: true,
      NODE_ENV: 'test',
    }
  },
});
