# Preview deployments

A preview is a throwaway copy of the Ocotillo frontend on Cloud Run, reachable at
a public URL, built from any branch. Use one to put a work-in-progress in front
of a reviewer or a user without touching staging or production.

Previews come in two flavours, chosen per deploy:

| Backend | What the frontend talks to | Data | Use it when |
|---|---|---|---|
| `staging` (default) | `https://ocotillo-api-staging.newmexicowaterdata.org` | Real staging data, shared | The branch only changes the frontend |
| `ephemeral` | A per-branch API + postgis spun up for this preview alone | Fake seed data, disposable | The branch needs unreleased OcotilloAPI changes, or you want a sandbox nobody else can disturb |

## Deploying

### From a pull request

Automatic. Opening, updating, or reopening a PR deploys a preview and comments
the URL on the PR. Closing the PR tears it down.

To give a PR an ephemeral backend, add the **`preview-backend`** label to the PR
and push a commit (or re-run the workflow). Without the label a PR preview uses
staging.

### From any branch, on demand

```bash
gh workflow run CD_preview_ondemand.yml --ref my-branch
```

With an ephemeral backend built from a matching API branch:

```bash
gh workflow run CD_preview_ondemand.yml \
  --ref my-branch \
  -f backend=ephemeral \
  -f backend_ref=BDMS-1234-new-endpoint \
  -f ttl_hours=24
```

Or from the Actions tab: **Preview deploy (on demand)** → *Run workflow* → pick
the branch and the inputs. The preview URL lands in the run's job summary.

`workflow_dispatch` reads the workflow *definition* from the default branch
(`staging`), but `--ref` selects the branch that actually gets built.

Inputs:

| Input | Default | Notes |
|---|---|---|
| `backend` | `staging` | `staging` or `ephemeral` |
| `backend_ref` | `staging` | Which `DataIntegrationGroup/OcotilloAPI` ref to build (ephemeral only) |
| `backend_auth` | `disabled` | See the warning below |
| `seed` | `true` | Runs `transfers.seed` against the ephemeral database |
| `ttl_hours` | `48` | Hours before the nightly sweep may delete the preview. `0` disables the TTL |

## Tearing down

Three automatic paths and one manual one:

- **PR close** — `CD_preview.yml` tears the preview down.
- **Branch deletion** — `CD_preview_teardown.yml` fires on the `delete` event.
- **Nightly sweep** — 09:00 UTC, removes previews past their TTL and previews
  whose branch no longer exists.
- **Manual**:

  ```bash
  gh workflow run CD_preview_teardown.yml -f branch=my-branch
  ```

Teardown deletes the frontend service, the ephemeral backend service if there is
one, both Artifact Registry image sets, and the authentik redirect URI. It is
idempotent — running it against a branch that has no preview succeeds and does
nothing.

The `delete` and `schedule` triggers only fire from the repository's default
branch, which is **`staging`**. Until `CD_preview_teardown.yml` is merged there,
branch-deletion cleanup and the nightly sweep do not run. The same applies to
`CD_preview_ondemand.yml`: `workflow_dispatch` only appears once the file is on
`staging`.

## How the ephemeral backend works

It is the Cypress job's docker-compose stack, re-expressed as one multi-container
Cloud Run service. `CI_cypress.yml` runs OcotilloAPI's `docker/app/Dockerfile`
alongside `postgis/postgis:17-3.5` under `docker compose`; the preview builds the
same two images and deploys them as Cloud Run sidecars
([`.github/preview/api-service.tmpl.yaml`](../.github/preview/api-service.tmpl.yaml)).

Sidecars share a network namespace, so the compose service name `db` simply
becomes `127.0.0.1:5432`. Everything else carries over: the same `alembic upgrade
head`, the same `python -m transfers.seed`.

Two things the compose setup does not have to worry about:

- **Cloud Run has no `exec`**, so the seed cannot be run as a follow-up command
  the way `CI_cypress.yml` does it. The API container's `command` is overridden
  with a small script that waits for postgres, migrates, seeds, then execs
  uvicorn.
- **The instance is the database.** Postgres data lives on an in-memory `tmpfs`
  volume, so the service is pinned to `minScale: 1, maxScale: 1` with CPU always
  allocated. A revision restart wipes the data and re-seeds.

### Limits and cautions

> **The ephemeral API is publicly reachable and, by default, runs with
> `AUTHENTIK_DISABLE_AUTHENTICATION=1`.** The default exists because
> `transfers.seed` creates no users and no permission rows — with authentik
> enforcement on, a seeded preview locks every user out. Treat these previews as
> public sandboxes: never load real or sensitive data into one. Pass
> `-f backend_auth=enabled` if the branch is specifically exercising auth and you
> have another way to populate permissions.

- Data does not survive a restart. Fine for a demo; not a place to park work.
- No GCS credentials are wired in, so file upload/download features will fail.
- `minScale: 1` means an ephemeral preview bills continuously until torn down.
  Keep the TTL short and tear previews down when you are finished.

## Layout

| File | Role |
|---|---|
| `.github/workflows/_preview_deploy.yml` | Reusable: build + deploy frontend, optional backend, authentik registration |
| `.github/workflows/_preview_teardown.yml` | Reusable: delete services, images, authentik entry |
| `.github/workflows/CD_preview.yml` | PR trigger — calls both reusables, comments the URL |
| `.github/workflows/CD_preview_ondemand.yml` | `workflow_dispatch` trigger for any branch |
| `.github/workflows/CD_preview_teardown.yml` | Manual, branch-delete, and nightly-sweep triggers |
| `.github/preview/api-service.tmpl.yaml` | Cloud Run spec for the ephemeral backend |

Both reusables key every resource off the same sanitized branch name. That
sanitizer is duplicated in the two files — **if you change one, change the
other**, or teardown will compute a different service name than deploy did and
silently leak resources.

Cloud Run services are labelled `preview=true`, `preview-branch=<sanitized>`,
`preview-role=frontend|api`, and `preview-expires=<epoch>` (`0` = no TTL), which
is how the nightly sweep finds them:

```bash
gcloud run services list --region us-central1 \
  --filter 'metadata.labels.preview=true' \
  --format 'table(metadata.name, metadata.labels.preview-branch, metadata.labels.preview-expires, status.url)'
```
