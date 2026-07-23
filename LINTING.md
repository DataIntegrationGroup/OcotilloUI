# Linting

OcotilloUI uses [Biome](https://biomejs.dev/) for linting and formatting.

## Running locally

```bash
# Check for lint errors and warnings
npm run lint

# Auto-fix fixable issues
npm run lint:fix

# Check formatting only
npm run format:check

# Auto-format all supported files
npm run format
```

## Ruleset

The config lives in `biome.json` at the repo root. It applies the current TypeScript/React baseline and skips generated/build output:

- `dist/**`
- `node_modules/**`
- `src/generated/**`
- `coverage/**`
- `cypress/**`

### Key rules

- `noExplicitAny` and `noImplicitAnyLet` — **warn**. Unsafe `any` usage is a signal to improve typing. Not an error yet to allow gradual cleanup.
- `noUnusedVariables` — **warn**. Unused variables should be cleaned up, but do not block the initial Biome migration.
- `useHookAtTopLevel` — **error**. Hooks called outside components or conditionally break React.
- `useExhaustiveDependencies` — **warn**. Missing hook dependencies are a common source of stale closure bugs.

## CI enforcement

[`CI_lint.yml`](.github/workflows/CI_lint.yml) runs `npm run lint` and `npm run typecheck` on every pull request. The build fails on any Biome **error**. Warnings are reported but do not block merge.

The goal is to graduate all current warnings to errors once the codebase is clean. See [Epic 1, Ticket 1.2](../nm-water-data/tickets/epics/epic-01-code-health.md) for the full plan. Epic 1 status and strict-mode progress are tracked in [code health and quality](https://github.com/DataIntegrationGroup/the-brain/blob/main/docs/process/code-health-and-quality.md) in the-brain repo.
