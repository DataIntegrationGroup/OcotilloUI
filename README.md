# NMBGMR Ocotillo

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE) [![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](#)

Admin dashboard application for managing and visualizing data for the New Mexico Bureau of Geology & Mineral Resources (
NMBGMR). Built with React, TypeScript, and Refine.dev, it provides an intuitive interface to interact with various
NMBGMR data sources, including NM aquifer, Pychron, NM wells, and ST2 data.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Notable Well IDs](#notable-well-ids)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## Features

- CRUD operations for Ocotillo system through a unified Admin Dashboard
- User authentication and authorization via Authentik
- Interactive map visualizations using Mapbox GL
- Data validation with React Hook Form and Zod
- Theming and layout via Material UI

## Tech Stack

- React & TypeScript
- Refine.dev (Admin Dashboard framework)
- Vite (Next-generation frontend build tool)
- Material UI (UI components)
- React Hook Form & Zod (Forms & validation)
- Mapbox GL (Map visualizations)
- Authentik (Authentication)
- Cypress (E2E Testing)

## Prerequisites

- Node.js v16+
- npm v6+

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/DataIntegrationGroup/NMBGMRDataManager.git
   cd NMBGMRDataManager
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment variable file for development:
   ```bash
   cp .env.development.example .env.development
   ```
4. Update the `.env.*` files with your API URLs, tokens, and Authentik credentials.
5. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Notable Well IDs

The following wells contain a full, rich set of information and are useful for testing the Well Show page and related UI:

- AR-0025
- HS-038
- QU-050
- QU-054
- TB-0203

## Configuration

This application uses Vite environment variables. The following variables are required in `.env.development`:

```bash
VITE_APP_TITLE="Ocotillo (Dev)"
VITE_NMBGMR_AMP_API_URL="https://your-amp-development-api-url"
VITE_NMBGMR_GEOTHERMAL_API_URL="https://your-geothermal-development-api-url"
VITE_OCOTILLO_API_URL="https://your-ocotillo-development-api-url"
VITE_REFINE_PROJECT_ID="your-refine-project-id"
VITE_MAPBOX_TOKEN="your-mapbox-token"
VITE_POSTHOG_KEY="your-posthog-project-api-key"
VITE_POSTHOG_HOST="https://us.i.posthog.com"
VITE_AUTHENTIK_CLIENT_ID="your-authentik-client-id"
VITE_AUTHENTIK_URL="https://your-authentik-domain"
VITE_AUTHENTIK_REDIRECT_URI="https://your-athentik-redirect"
```
- If you plan to develop against a locally hosted version of an API, change your API Urls accoringly

## Scripts/Commands - Dev and Build

- `npm run dev`: Runs the app in development mode with hot-reloading.
- `npm run build`: Builds the app for production (outputs to `dist/`).
- `npm run start`: Serves the production build locally.
- `npm run refine`: Runs Refine CLI commands.

## Scripts/Commands - Mock Servers, Testing, Type/Zod Generation

- `npm run mock:server:vitest`: Runs a Prism mock server to run the vitest test suite. Uses the committed `openapi-auth.json` in the repo root (no network fetch for startup).
- `npm run mock:server:cypress`: Runs a Prism mock server to run the cypress test suite. Same spec file as vitest.
- `npm run test:run`: Runs the Vitest test suite a single time.
- `npx cypress open`: Opens the Cypress browser to run and interact with Cypress tests.
- `npx cypress run`: Runs the Cypress test suite in headless mode a single time.
- `npm run openapi:generate`: Runs hey-api TypeScript and Zod generation using `./openapi-auth.json` into `src/generated`.

## Refreshing the OpenAPI spec

Prism mocks and codegen both use **`openapi-auth.json`** at the repo root. When the staging API adds or changes schemas, refresh the file from staging and regenerate so contract tests and `zWellResponse` validation stay aligned:

```bash
curl -fsSL "https://ocotillo-api-staging.newmexicowaterdata.org/openapi-auth.json" -o openapi-auth.json
npm run openapi:generate
```

Then run tests and commit `openapi-auth.json` plus `src/generated/` updates as needed.

## Running the Vitest Test Suite

This test suite uses the data provider against a mock server for contract tests or unit tests, and the mock server needs to be running first:

- Start mock server
```bash
npm run mock:server:vitest
```
- Run vitest suite once
```bash
npm run test:run
```

## Running the Cypress Test Suite

This test suite runs Cypress for E2E or Component tests, and the mock server and app build need to be running:

- Start mock server (with seed set)
```bash
npm run mock:server:cypress
```
- Serve production build locally (matches CI Cypress workflow)
```bash
npm run build
npm run start
```
- Open Cypress testing environment to run tests and interact with Cypress against your locally running app
```bash
npx cypress open
```
or
- Run Cypress tests once in headless mode against your locally running app
```bash
npx cypress run
```

## Tests in CI and Openapi-TS Generation

Both the Vitest and Cypress test suites run via a Github action on PR. The Vitest contract tests may fail when the committed **`openapi-auth.json`** is older than the API schemas your Zod types expect.

When the API changes, refresh **`openapi-auth.json`** from staging (see **Refreshing the OpenAPI spec** above), run:

```bash
npm run openapi:generate
```

Fix any failing tests and related code, then commit `openapi-auth.json` and `src/generated/` together with your changes.

## Building and Serving Production Build

```bash
npm run build
npm run start
```

## Deployment

Deploy the contents of the `dist/` folder to any static hosting provider (e.g., Netlify, Vercel, AWS S3, GitHub Pages,
GCP). Ensure environment variables are configured on the hosting platform.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.

## Contact

New Mexico Bureau of Geology & Mineral Resources  
[https://newmexicowaterdata.org](https://newmexicowaterdata.org)

## Acknowledgements

- [Refine.dev](https://refine.dev)
- [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/)
- [Material UI](https://mui.com)
- [Cypress](https://www.cypress.io/)
