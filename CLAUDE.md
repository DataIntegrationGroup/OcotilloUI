---
generated-by: claude-opus-5
generated-on: 2026-08-22
prompted-by: jakeross
---

# CLAUDE.md

Guidance for Claude Code in the OcotilloUI repository. The full agent guide lives in `AGENTS.md`, imported below — read it before making changes.

## Branching, in short

**Feature, fix, chore, docs, and CI branches all base off `origin/staging` and target `staging` in their PR.** Only a hotfix bases off `production`.

```bash
git fetch origin && git checkout -b chore/bdms-1234-short-description origin/staging
```

`production` is the repository's default branch, so a branch cut without passing an explicit base starts there — and a `production`-based PR into `staging` drags unrelated commits into the diff. Always pass `origin/staging` explicitly. See [Where to branch from](AGENTS.md#where-to-branch-from) for the full rule.

@AGENTS.md
