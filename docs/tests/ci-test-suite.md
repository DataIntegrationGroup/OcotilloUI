# CI Test Suite

OcotilloUI runs several automated checks on every pull request. These checks are split into separate GitHub Actions workflows so linting, type checking, unit/integration tests, browser tests, and production build validation fail independently.

## Workflow Summary

| Workflow | Purpose | Main commands |
|---|---|---|
| `.github/workflows/CI_lint.yml` | Biome linting and TypeScript type checking | `npm run lint`, `npm run typecheck` |
| `.github/workflows/CI_vitest.yml` | Generated API drift check and Vitest suite | `npx @hey-api/openapi-ts`, `npm run mock:server:vitest`, `npm run test:run` |
| `.github/workflows/CI_cypress.yml` | End-to-end browser tests against a seeded API | `npm run build:fast`, Cypress GitHub Action |
| `.github/workflows/CI_production_build.yml` | Production build validation | `npm run build:ci` |

## Local Commands

Use these commands before opening or updating a pull request:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:run
npm run build:ci
```

For coverage reports:

```bash
npm run test:coverage
```

For interactive Vitest work:

```bash
npm run test
npm run test:ui
```

## Lint And Typecheck

The lint workflow runs on every pull request:

```bash
npm run lint
npm run typecheck
```

`npm run lint` runs Biome against the repo. The Biome configuration lives in `biome.json`; more linting detail is documented in `LINTING.md`.

`npm run typecheck` runs `tsc` using the repository TypeScript configuration. This catches type errors that may not appear while running Vite locally.

Common failures:

- Biome rule violations in changed TypeScript, React, JSON, or Markdown files
- Unused imports or variables that have been promoted to errors
- Type errors caused by changed interfaces, generated API types, props, or provider contracts
- Missing type declarations for new dependencies or imported modules

## Generated API Drift Check

The Vitest workflow first regenerates API types and Zod schemas:

```bash
npx @hey-api/openapi-ts
```

It then stages `src/generated/` and checks whether regeneration changed any generated files. If Git sees generated changes, CI fails with instructions to run:

```bash
npm run openapi:generate
```

This prevents pull requests from changing the OpenAPI spec or generator inputs without committing the resulting generated TypeScript and schema files.

Common failures:

- `openapi-auth.json` changed but `src/generated/` was not regenerated
- Generator configuration changed in `openapi-ts.config.ts`
- Generated files were edited manually and no longer match the spec output

## Vitest

Vitest tests are configured in `vite.config.ts` under the `test` key. The suite uses:

- `globals: true`
- Node test environment
- `src/test/setup.ts` as the setup file
- V8 coverage through `@vitest/coverage-v8`

The workflow starts a Prism mock server before running tests:

```bash
npm run mock:server:vitest
npm run test:run
```

`npm run mock:server:vitest` runs:

```bash
prism mock openapi-auth.json --dynamic=false --port 4010
```

The workflow waits for `http://127.0.0.1:4010` to respond before starting Vitest. A response from `/` may be a 404 because Prism has no matching route for that path; CI treats any response as proof that the mock server is accepting connections.

Test files are mostly under `src/test/`, with some colocated `*.test.ts` files in source folders. Current coverage includes utilities, components, hooks, providers, config, pages, hydrograph logic, and Ocotillo API contract tests.

Common failures:

- A component test needs missing setup in `src/test/setup.ts`
- API contract tests no longer match `openapi-auth.json`
- A provider changed request paths, response parsing, or error handling
- A test assumes browser APIs that are unavailable in the Node test environment
- Prism did not start on port `4010`

## Cypress End-To-End Tests

Cypress E2E tests run in `.github/workflows/CI_cypress.yml` on every pull request. These tests exercise the built frontend in Chrome against a real FastAPI backend and database.

The workflow:

1. Checks out this frontend repository.
2. Checks out `DataIntegrationGroup/NMSampleLocations` at the `staging` branch into `api-repo`.
3. Starts the backend with Docker Compose.
4. Waits for `http://localhost:8000/docs`.
5. Seeds the database with `python -m transfers.seed`.
6. Builds the frontend with `npm run build:fast`.
7. Runs Cypress against the Vite preview server.

The Cypress config lives in `cypress.config.ts`. In CI, E2E tests use:

```text
baseUrl: http://localhost:4173
```

The workflow runs these specs:

```text
cypress/e2e/test-api-connectivity.cy.ts
cypress/e2e/ocotillo/**/*.cy.ts
```

Authentication is disabled for CI by setting test-oriented environment variables, including:

```text
NODE_ENV=test
MODE=development
OCOTILLO_API_URL=http://localhost:8000
VITE_OCOTILLO_API_URL=http://localhost:8000
VITE_TEST_AUTH=true
AUTHENTIK_DISABLE_AUTHENTICATION=${{ secrets.AUTHENTIK_TEST }}
```

Common failures:

- Docker Compose cannot build or start the backend
- PostgreSQL is not ready before the app tries to connect
- The backend readiness probe at `/docs` times out
- Database seed data changed and the Cypress assertions need updating
- Frontend routes or labels changed without updating Cypress specs
- A Cypress test depends on record ordering that is not stable

## Production Build Validation

The production build workflow runs on every pull request:

```bash
npm run build:ci
```

`build:ci` runs:

```bash
VITE_DISABLE_SOURCEMAP=true VITE_SENTRY_TELEMETRY_DISABLED=true NODE_OPTIONS="--max-old-space-size=4096" tsc && vite build
```

This check verifies that the app typechecks and can produce a production Vite build with source maps and Sentry telemetry disabled for CI stability.

Common failures:

- TypeScript errors that block `tsc`
- Vite build errors from invalid imports, missing assets, or environment assumptions
- Bundling issues caused by dependency changes
- Memory-sensitive build failures

## Debugging Failed CI

Start with the failing workflow name, then run the closest local command:

| Failed workflow | First local command |
|---|---|
| Lint | `npm run lint` |
| Lint typecheck step | `npm run typecheck` |
| Vitest generated check | `npm run openapi:generate` |
| Vitest test step | `npm run mock:server:vitest` in one shell, then `npm run test:run` in another |
| Cypress | Reproduce with the backend, seeded database, and Cypress spec named in the CI logs |
| PR Build Test | `npm run build:ci` |

When fixing tests, prefer updating the behavior or fixture data that changed rather than weakening assertions. If generated files changed, review the generated diff before committing it so API contract changes are intentional.
