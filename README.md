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
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## Features

- CRUD operations for NMBGMR databases through a unified Admin Dashboard
- User authentication and authorization via Fief
- Interactive map visualizations using Mapbox GL
- Data validation with React Hook Form and Yup
- Theming and layout via Material UI

## Tech Stack

- React & TypeScript
- Refine.dev (Admin Dashboard framework)
- Vite (Next-generation frontend build tool)
- Material UI (UI components)
- React Hook Form & Yup (Forms & validation)
- Mapbox GL (Map visualizations)
- Fief (Authentication)

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
3. Create environment variable files:
   ```bash
   cp .env.development.example .env.development
   cp .env.devserver.example .env.devserver
   cp .env.production.example .env.production
   ```
4. Update the `.env.*` files with your API URLs, tokens, and Fief credentials.
5. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Configuration

This application uses Vite environment variables. The following variables are required in `.env.development` and
`.env.devserver`:

```bash
VITE_APP_TITLE="NMBGMR Ocotillo"
VITE_NMBGMR_AMP_API_URL="https://your-amp-api-url"
VITE_NMBGMR_GEOTHERMAL_API_URL="https://your-geothermal-api-url"
VITE_REFINE_PROJECT_ID="your-refine-project-id"
VITE_MAPBOX_TOKEN="your-mapbox-token"
VITE_FIEF_BASE_URL="https://your-fief-domain"
VITE_FIEF_CLIENT_ID="your-fief-client-id"
```

In `.env.production`, you can set:

```bash
VITE_API_URL="https://your-production-api-url"
VITE_APP_TITLE="NMBGMR Ocotillo"
```

## Available Scripts

- `npm run dev`: Runs the app in development mode with hot-reloading.
- `npm run build`: Builds the app for production (outputs to `dist/`).
- `npm run start`: Serves the production build locally.
- `npm run refine`: Runs Refine CLI commands.
- `npm run mock:server`: Runs the mock server for running the test suite
- `npm run test:run`: Runs the test suite a single time

## Running the Test Suite

The test suite uses the data provider against a mock server, and the mock server needs to be running:

```bash
npm run mock:server
npm run test:run
```

## Building for Production

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
