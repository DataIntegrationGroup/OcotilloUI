import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },

  e2e: {
    baseUrl: process.env.CI
    ? "http://localhost:4173"   
    : "http://localhost:5173",
    setupNodeEvents(on, config) {
      process.env.NODE_ENV = 'test'
    },
    env: {
      // set test auth variable to true to mock Authentik provider token
      VITE_TEST_AUTH: true,
      NODE_ENV: 'test',
    }
  },
});
