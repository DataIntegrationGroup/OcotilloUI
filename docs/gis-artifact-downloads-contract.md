---
generated-by: claude-opus-5
generated-on: 2026-08-23
prompted-by: jakeross
---

# Implementing the GIS artifact downloads

Task brief for an agent working in **OcotilloUI**. Adds a surface that lets a
user download ready-made QGIS and ArcGIS Pro files for our OGC API layers, so
they can open our data in a desktop GIS without configuring a connection by
hand.

The API side is built and tested; nothing here needs backend work. Read
`AGENTS.md` and `FRONTEND.md` first — this document assumes their conventions
and does not repeat them.

## Before you can start: the spec is not in this repo yet

`src/generated/` is emitted from the committed `openapi-auth.json`, and **that
snapshot has no `/gis` paths** — the endpoints exist on an unmerged API branch
(`feat/ogc-desktop-gis-artifacts`) and are not deployed. Confirm before
starting:

```bash
python3 -c "import json;print([p for p in json.load(open('openapi-auth.json'))['paths'] if p.startswith('/gis')])"
```

Empty list means you are blocked on one of:

1. the API branch merging and deploying, then refresh the spec from the
   deployed `/openapi-auth.json`; or
2. running that API branch locally and pulling the spec from it.

Then regenerate and commit the output alongside the spec, per `AGENTS.md`:

```bash
npm run openapi:generate
```

Do not hand-write the types in `src/generated/`. Do not proceed by typing the
responses by hand in application code either — the generated zod schemas are
how every other surface in this repo validates responses, and diverging here
means the next spec change breaks silently instead of at build time.

Use `/openapi-auth.json`, **not** `/openapi.json`. The latter is the anonymous
schema and omits the authenticated internal-connections route.

## What the API offers

Base URL is whatever `VITE_API_URL` (or the existing API config) already
resolves to. All routes are `GET`, no request body.

| Route | Returns | Auth |
|---|---|---|
| `/gis?f=json` | catalogue, JSON | none |
| `/gis/qgis/connections.xml` | QGIS connections file | none |
| `/gis/qgis/layers/{layer_id}.qlr` | styled QGIS layer | none |
| `/gis/arcgis/layers/{layer_id}.lyrx` | styled ArcGIS Pro layer | none |
| `/gis/qgis/connections-internal.xml` | connections incl. internal mount | **viewer role** |

### The catalogue drives everything

```
GET /gis?f=json
```

`/gis` is content-negotiated: HTML by default (it is also a human-facing
landing page), JSON on `?f=json` or `Accept: application/json`. Always pass
`?f=json` explicitly rather than relying on the Accept header — axios defaults
vary and an HTML response into a JSON parser is a confusing failure.

```jsonc
{
  "service_url": "https://ocotillo-api.../ogcapi",
  "connections": [
    {
      "client": "qgis",
      "href": "https://ocotillo-api.../gis/qgis/connections.xml",
      "media_type": "text/xml",
      "filename": "ocotillo-ogcapi-connections.xml"
    }
  ],
  "layers": [
    {
      "id": "water-level-trend",
      "title": "Water-Level Trend",
      "abstract": "Direction of the fitted depth-to-water trend at each well…",
      "collection": "depth_to_water_trend_wells",
      "collection_url": "https://ocotillo-api.../ogcapi/collections/depth_to_water_trend_wells",
      "geometry": "Point",
      "renderer": "categorized",
      "downloads": [
        {
          "client": "qgis",
          "href": "https://ocotillo-api.../gis/qgis/layers/water-level-trend.qlr",
          "media_type": "text/xml",
          "filename": "water-level-trend.qlr"
        },
        {
          "client": "arcgis",
          "href": "https://ocotillo-api.../gis/arcgis/layers/water-level-trend.lyrx",
          "media_type": "application/json",
          "filename": "water-level-trend.lyrx"
        }
      ]
    }
  ]
}
```

`renderer` is one of `single | graduated | categorized`. It describes how the
layer is symbolised and is there if you want an icon or a caption; it is not
required to build the download.

**Do not hardcode the layer ids.** They come from a YAML config on the API side
and are expected to change — layers get added, and one has already been renamed
during development. There are six today. Render whatever the catalogue returns.

**Do not construct download URLs yourself.** Use `href` verbatim. It is
absolute and built from the API's configured base URL, so it is already correct
for staging, production and a preview environment pointed at an ephemeral API.
Building `${base}/gis/qgis/layers/${id}.qlr` in the frontend duplicates a rule
that lives on the server and will drift.

## The one real gotcha: you cannot read the filename from the response

The API sends `Content-Disposition: attachment; filename="…"`, but CORS on this
API is configured with `allow_origins=['*']` and **no** `expose_headers`.
Verified against a running instance with an `Origin` header set:

```
access-control-allow-origin:   https://ocotillo.newmexicowaterdata.org
access-control-expose-headers: <ABSENT>
content-disposition:           attachment; filename="water-wells.qlr"
```

The header is on the wire, but the browser will not let JS read it
cross-origin. `response.headers.get('content-disposition')` returns `null` in
the app even though curl shows it.

**This is already solved: use the `filename` from the catalogue.** That field
exists for exactly this reason. Do not ask for a backend CORS change, and do
not parse `Content-Disposition`.

### Anonymous downloads — plain anchor, no JS

The four anonymous routes are attachments. A plain link is the whole
implementation, and the browser handles the save dialog, progress and errors:

```tsx
<Button component='a' href={download.href} download={download.filename}>
  Download for QGIS
</Button>
```

Do not `fetch()` these into a blob. It buys nothing, costs you the browser's
native download handling, and puts a few KB through the JS heap for no reason.

### The internal connections file — fetch, because it needs a bearer token

An anchor cannot send an `Authorization` header, so
`/gis/qgis/connections-internal.xml` is the one case that needs a blob:

```ts
const response = await axiosInstance.get(href, { responseType: 'blob' })
const url = URL.createObjectURL(response.data)
const anchor = document.createElement('a')
anchor.href = url
anchor.download = filename // from the catalogue, not the response headers
anchor.click()
URL.revokeObjectURL(url)
```

Use the repo's existing authenticated axios instance so the token refresh
interceptor applies. Gate the control on the viewer role through the existing
`accessControl` provider rather than catching a 403 after the fact.

## Things that will bite you

**Do not let a JSON interceptor touch the `.lyrx`.** It is served as
`application/json` because that is what it is, but it is a *file*. If axios
parses it and something later re-serialises it, key order and formatting change
and you may hand ArcGIS Pro a subtly different document. Always request it with
`responseType: 'blob'` if you fetch it at all — or better, use an anchor and
never touch it.

**Compare media types after stripping parameters.** The server sends
`text/xml; charset=utf-8`, while the catalogue says `text/xml`. If you assert
equality anywhere, split on `;` first.

**Responses are generated per request** from live config plus a database
lookup. They are small, but do not build an aggressive client-side cache that
would serve a stale URL after a deploy moves environments. TanStack Query's
defaults are fine; the catalogue is a good candidate for a normal `useQuery`
with the default `staleTime`.

**`404` is the error you will actually hit** — a `layer_id` that no longer
exists, which is the failure mode of hardcoding ids. Body is
`{ "detail": "No curated layer 'x'." }`. `422` only fires on path-param
validation.

## What to build

Minimum useful surface, in repo layout terms:

- `src/hooks/` — a `useGisArtifacts()` hook wrapping `GET /gis?f=json` with
  TanStack Query, returning the parsed catalogue typed from `src/generated`.
- `src/components/` — a presentational component listing the layers: title,
  abstract, and one download control per `client`. Plus a prominent
  "connect to everything" control for the connections file, since that is the
  better path for most users and the per-layer files are the narrow case.
- A route/page wiring the two together, registered the way `AGENTS.md`
  describes (`src/routes/`, `src/config/navigation.ts`, access-control aware).
- `src/test/` — Vitest specs mirroring the tree.

Copy worth reusing, because it is the part users get wrong: the connections
file is imported in QGIS through **Browser panel → right-click "WFS / OGC API -
Features" → Load Connections**. ArcGIS Pro has no importable connection file
from us — the user adds the connection once via *Insert → Connections → Server
→ New OGC API Server* and pastes `service_url`. Surface `service_url` as
copyable text for that reason.

## Acceptance criteria

- [ ] `openapi-auth.json` refreshed and `src/generated/` regenerated, both
      committed together; no hand-edits under `src/generated/`.
- [ ] Layer list is rendered from the catalogue response. Grepping the source
      for `water-level-trend` or any other layer id returns nothing.
- [ ] Download URLs come from `href`; no string concatenation of API paths.
- [ ] Saved filenames come from the catalogue's `filename`; nothing reads
      `Content-Disposition`.
- [ ] Anonymous downloads use an anchor, not a blob round-trip.
- [ ] The internal-connections control is role-gated, uses the authenticated
      axios instance, and is absent for a user without the viewer role.
- [ ] Vitest covers: catalogue renders N layers from a fixture, a download
      control carries the exact `href` and `filename` from the fixture, and the
      internal control is hidden without the role.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:run` all clean.
- [ ] Branched from `origin/staging` and targeting `staging`.

## Verifying against a real API

Prism mocks `openapi-auth.json`, so once the spec is refreshed
`npm run mock:server:cypress` serves these routes without the backend. The mock
returns schema-shaped data, not real files — good enough for component tests,
not for confirming a file opens in QGIS.

To check a real artifact end to end, fetch one and open it:

```bash
curl -sOJ https://ocotillo-api.newmexicowaterdata.org/gis/qgis/layers/water-level-trend.qlr
```

Dragging that onto a QGIS canvas should give a styled point layer with a
red/blue/grey trend legend and roughly 2,450 features. That path is already
verified on the API side against QGIS 4.0.1; if it fails, the problem is the
environment, not your frontend code.

---

## How this repo consumes it today

Added on the branch that wired the catalogue into the datasets page
(`/ocotillo/collections`). Two deviations from the plan above, both deliberate.

**Types are hand-written zod, not generated.** `openapi-auth.json` still has no
`/gis` paths, and the only available source is the unmerged API branch. A spec
dumped from that branch is a superset: five `/gis` paths, but also two unrelated
unreleased endpoints and eight changed schemas — `WellResponse`, `ThingResponse`
and `SpringResponse` among them — which the rest of the app validates against.
Refreshing the whole snapshot to reach `/gis` would have re-generated all of
that on a feature branch.

So `src/utils/gisArtifacts.ts` carries hand-written zod for the catalogue only,
scoped to the GIS surface and marked for replacement. **When the API branch
merges and deploys: refresh the spec, run `npm run openapi:generate`, and delete
those schemas in favour of the generated ones.** Nothing else in the app depends
on them.

**The surface is the existing datasets page, not a new route.** Per-layer
downloads render on the collection row they belong to, matched on the
catalogue's `collection` field against the collection id the page already
resolves. The connections file, the QGIS import instructions and the copyable
`service_url` sit in one panel above the groups.

Everything else follows the contract: hrefs and filenames verbatim from the
catalogue, anonymous downloads as plain anchors, no layer ids in source, and the
internal connections file fetched as a blob through the authenticated axios
instance behind an `AMP.Viewer` check.

### One gap on the API side

`/gis?f=json` lists only anonymous artifacts, so
`/gis/qgis/connections-internal.xml` appears nowhere in the catalogue. The
frontend currently derives it from the public entry's `href` by swapping
`connections.xml` for `connections-internal.xml` — string surgery of exactly the
kind this contract says to avoid, and the only place the rule is broken.

The clean fix is on the API: list the internal connection in the catalogue (for
authenticated callers, or unconditionally, since the route enforces its own
auth). `deriveInternalGisConnection` in `src/utils/gisArtifacts.ts` should be
deleted when that lands.
