# Linting

OcotilloUI uses [ESLint](https://eslint.org/) with the flat config format (`eslint.config.ts`) and [Prettier](https://prettier.io/) for formatting.

## Running locally

```bash
# Check for lint errors and warnings
npm run lint

# Auto-fix fixable issues
npm run lint:fix

# Check formatting only (Prettier)
npx prettier --check .

# Auto-format all files
npx prettier --write .
```

## Ruleset

The config lives in `eslint.config.ts` at the repo root. It applies to all `*.ts` and `*.tsx` files and covers:

| Plugin | Purpose |
|--------|---------|
| `@eslint/js` | Core JS recommended rules |
| `typescript-eslint` | TypeScript type-aware rules |
| `eslint-plugin-react` | React best practices |
| `eslint-plugin-react-hooks` | Enforces the rules of hooks |
| `eslint-plugin-react-refresh` | Vite HMR compatibility |
| `eslint-config-prettier` | Disables rules that conflict with Prettier |

### Key rules

- `@typescript-eslint/no-explicit-any` — **warn**. Explicit `any` is a signal to improve typing. Not an error yet to allow gradual cleanup.
- `@typescript-eslint/no-unused-vars` — **warn**. Variables prefixed with `_` are exempt.
- `react-hooks/rules-of-hooks` — **error**. Hooks called outside components or conditionally break React.
- `react-hooks/exhaustive-deps` — **warn**. Missing `useEffect` deps are a common source of stale closure bugs.

## CI enforcement

[`CI_lint.yml`](.github/workflows/CI_lint.yml) runs `npm run lint` and `npm run typecheck` on every pull request. The build fails on any ESLint **error**. Warnings are reported but do not block merge.

The goal is to graduate all current warnings to errors once the codebase is clean. See [Epic 1, Ticket 1.2](../nm-water-data/tickets/epics/epic-01-code-health.md) for the full plan. Epic 1 status and strict-mode progress are tracked in [code health and quality](https://github.com/DataIntegrationGroup/the-brain/blob/main/docs/process/code-health-and-quality.md) in the-brain repo.

## Prettier config

Prettier is configured in `.prettierrc`:

```json
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true
}
```
