---
generated-by: claude-opus-5
generated-on: 2026-08-07
prompted-by: jakeross
---

# ADR 0003 — Offline Well Viewing

**Status:** Draft
**Ticket:** none yet.
**Date:** 2026-08-07
**Deciders:** OcotilloUI frontend team; security/data owner for the at-rest PII question (Q5)
**Scope:** `OcotilloUI` only. No backend change is required for this ADR — the API
dependencies it names (bundled well download, conditional requests) are optimizations,
not prerequisites.
**Related:** [ADR 0004](0004-offline-field-data-capture.md) covers the write path and
depends on this one.

## Context

Field staff visit wells in parts of New Mexico with no usable cellular data. Today
OcotilloUI is a pure online SPA: every route render issues live HTTP requests through
Refine data providers, and every map tile is fetched from a public tile host. With no
network, the app shell itself fails to load (nginx `try_files` never runs), so the user
gets a browser error page rather than a degraded app.

Two concrete requirements drive this ADR:

1. **Explicit pinning** — a "Use Offline" control on the wells list
   ([list.tsx](../../src/pages/ocotillo/thing/list.tsx)) lets a user deliberately mark a well
   for offline availability before leaving connectivity.
2. **Implicit caching** — any well opened in Ocotillo
   ([well-show.tsx](../../src/pages/ocotillo/thing/well-show.tsx)) becomes viewable offline
   afterward, without the user asking.

### Relevant facts about the current system

| Area | Current state | Consequence for offline |
| --- | --- | --- |
| App shell | Vite SPA served by nginx; hashed assets `Cache-Control: immutable`, `index.html` uncached ([nginx.conf](../../nginx.conf)) | Shell is precacheable, but nothing registers a service worker today |
| Data access | Refine v5 data providers, axios instance with bearer token ([ocotillo-data-provider.ts](../../src/providers/ocotillo-data-provider.ts)) | Single choke point exists for read interception |
| Well detail | `GET thing/water-well/{id}/details` via `dataProvider.custom()` inside [useWellDetails.ts](../../src/hooks/useWellDetails.ts) | One request carries well, contacts, sensors, deployments, screens — a natural bundle unit |
| Attachments | `asset` list returns **signed URLs valid 15 minutes**, refetched every 10 min ([well-show.tsx:104](../../src/pages/ocotillo/thing/well-show.tsx:104)) | Caching the URL is useless offline; bytes must be captured at pin time |
| Query cache | Refine constructs its **own** `QueryClient` internally; the app *also* mounts a nested `QueryClientProvider` inside `<Refine>` ([AppProviders.tsx](../../src/AppProviders.tsx)) | Two clients coexist; any persistence layer must target one deliberately |
| Auth | Authentik OIDC, access/refresh tokens in `localStorage`, refresh interceptor on 401 ([authentik-provider.ts](../../src/providers/authentik-provider.ts)) | Offline token refresh is impossible; auth must not hard-fail offline |
| Access control | CASL rules derived from token groups ([access-control-provider.ts](../../src/providers/access-control-provider.ts)) | Permissions must be readable offline or every card renders as denied |
| Maps | MapLibre GL; OpenFreeMap vector + USGS raster tiles, key-free ([basemaps.ts](../../src/basemaps.ts)) | Tiles are plain URL GETs with no auth — cacheable by a service worker |
| Version banner | Polls `/version.json` every 5 min ([useNewVersion.ts](../../src/hooks/useNewVersion.ts)) | Must coexist with a service worker update lifecycle, not fight it |

### Non-goals for this ADR

- **Offline writes.** Editing, the groundwater-level stepper form, and the well
  inventory form stay online-only. A queue-and-sync design has different failure modes
  (conflict resolution, idempotency, partial submission) and deserves its own ADR.
- Offline availability of AMP, ST2, geothermal, geochronology, or OGC API resources
  beyond what a pinned well bundle explicitly includes.
- Full-catalog offline search over all wells.

## Decision

Adopt a **two-layer hybrid**:

**Layer 1 — Service worker (Workbox via `vite-plugin-pwa`)** owns everything addressed
purely by URL and served without an `Authorization` header:

- Precache the app shell and hashed build assets (`index.html` served
  `NetworkFirst` so deploys still propagate; JS/CSS/fonts `CacheFirst`).
- Runtime-cache basemap tiles and glyphs (`CacheFirst`, bounded by an
  `ExpirationPlugin` entry cap and max-age).
- Make the app installable (web app manifest) so field users get a standalone icon.

**Layer 2 — Application-level offline store (IndexedDB)** owns authenticated API data,
because it needs semantics a URL cache cannot express: bundling many requests into one
"well", pinning that survives eviction, per-well sync status, and a manageable UI.

- A `withOfflineCache(dataProvider)` decorator wraps `ocotilloDataProvider` in
  [AppProviders.tsx](../../src/AppProviders.tsx). It intercepts `getOne`, `getList`, and
  `custom` (the last is what `useWellDetails` uses), writing successful responses into
  IndexedDB and reading from IndexedDB when the network is unavailable or a request
  fails with a network error.
- A `wellOfflineBundle` record is the unit of caching:

  ```
  {
    wellId, pinned: boolean, pinnedAt, lastSyncedAt, schemaVersion, sizeBytes,
    details,            // thing/water-well/{id}/details payload
    assets: [{ id, filename, contentType, blob }],   // bytes, not signed URLs
    manualObservations,     // full series -- see Q3
    transducerObservations, // trailing 12 months only -- see Q3
    tileKeys[]
  }
  ```

- **Pinned** bundles (`pinned: true`) are never evicted automatically and are
  refreshed opportunistically when connectivity returns.
- **Viewed** bundles (`pinned: false`) are written on every successful well-show load
  and evicted LRU beyond a cap (proposed: 50 wells or a storage budget, whichever
  binds first).
- Pinning is a **superset of viewing**: pinning fetches the full bundle eagerly,
  including asset bytes and map tiles; viewing captures whatever the page already
  fetched plus a background asset/tile fill.

### Supporting decisions

1. **Consolidate the query client.** Create one `QueryClient` and hand it to Refine via
   `options.reactQuery.clientConfig`, then delete the nested `QueryClientProvider`
   inside `<Refine>`. Without this, Refine hooks and `useWellDetails` can resolve
   different clients and cache behavior becomes non-deterministic. This is a
   prerequisite, not an optional cleanup.
2. **Do not persist the whole TanStack Query cache.** `@tanstack/query-persist-client`
   is tempting but ties offline durability to `gcTime` and serializes blobs poorly.
   IndexedDB bundles are the source of truth; the query cache stays in memory and is
   *hydrated from* bundles.
3. **Offline auth grace window.** When `navigator.onLine === false` (or a refresh
   attempt fails with a network error), the auth provider returns `authenticated:
   true` if a stored session exists and its recorded `offlineGraceExpiresAt` (7 days,
   capped by refresh-token expiry — see [Q1](#q1--offline-auth-grace-window)) has not
   passed. CASL rules are snapshotted
   into IndexedDB on each successful login/refresh and replayed offline. On explicit
   logout, or when a refresh returns a real `invalid_grant`, **all offline stores are
   wiped**, since the bundles contain authenticated data.
4. **Signed asset URLs are never cached as URLs.** Pinning downloads asset bytes into
   IndexedDB and the UI serves them via `URL.createObjectURL`. Assets above a size
   threshold (proposed: 25 MB each) are skipped with a visible note rather than
   silently blowing the quota.
5. **Map tiles for a pinned well are bounded and prefetched.** At pin time, compute the
   tile set covering a 2 km radius around the well point, from z10 up to the active
   basemap's own `maxzoom`, and `cache.addAll()` them into a dedicated Cache Storage
   bucket, recording the keys on the bundle so unpinning can release them. See
   [Q2](#q2--tile-radius-and-zoom-range) for the sizing derivation: ~131 raster tiles
   (≤8 MB) or ~25 vector tiles plus style/sprite/glyphs (~2 MB) per well.
6. **Storage is explicitly negotiated.** Call `navigator.storage.persist()` on first
   pin and surface `navigator.storage.estimate()` in the offline management UI. Refuse
   new pins past a budget with an actionable message rather than failing mid-write.
7. **Offline state is visible, never silent.** A global offline indicator, plus
   per-page "Showing cached data from {lastSyncedAt}" banners. Cards whose data was not
   captured render an explicit "unavailable offline" state instead of an empty or
   perpetually-loading card.

### User-facing surfaces

| Surface | Behavior |
| --- | --- |
| Wells list row action + bulk action ([list.tsx](../../src/pages/ocotillo/thing/list.tsx)) | "Use Offline" toggle; shows progress while the bundle downloads, then a pinned indicator |
| Well show header ([OcotilloPageHeader](../../src/components/OcotilloPageHeader)) | Same toggle, plus last-synced timestamp |
| New `/offline` management page | Pinned wells, per-well size, last sync, total storage used, "sync all", unpin |
| Offline banner | App-wide connectivity state and staleness |

### Rollout phases

1. **Phase 1 — Shell.** `vite-plugin-pwa`, manifest, precache, tile runtime cache, SW
   update flow reconciled with `useNewVersion`. App opens offline; data is empty.
2. **Phase 2 — Implicit well cache.** Query client consolidation, IndexedDB store,
   provider decorator, offline banner. Viewed wells replay offline (no asset bytes).
3. **Phase 3 — Explicit pin.** "Use Offline" on list and show, asset byte capture, tile
   prefetch, `/offline` page, storage negotiation.
4. **Phase 4 — Auth grace + sync.** Offline auth window, CASL snapshot, background
   refresh of pinned bundles on reconnect.

Each phase ships behind a feature flag so field testing can precede general exposure.

## Alternatives Considered

**A. Service worker only — cache authenticated API GETs with Workbox.**
Rejected. Zero app-code changes is attractive, but a URL cache cannot express "this
well is pinned", cannot bundle a well's several requests as a unit, cannot survive
signed-URL expiry, and gives the UI nothing to render sync state from. Cache keys also
ignore the `Authorization` header, so a user switch would serve another user's data
unless caches are wiped on logout anyway.

**B. Persist the TanStack Query cache to IndexedDB (`persistQueryClient`).**
Rejected as the primary mechanism. It is the cheapest path to "viewed wells work
offline", but durability is coupled to `gcTime`, blobs do not serialize, pinning has no
natural representation, and the double-`QueryClient` situation makes the blast radius
unclear. May still be used *inside* Phase 2 as an implementation detail for hydration.

**C. Local replica database (RxDB / PouchDB / SQLite-WASM) with sync.**
Rejected for now. It is the right shape if and when offline *writes* land, but it
implies a sync protocol on the API side that does not exist, and it is heavy for a
read-only requirement.

**D. Generate an offline PDF per well instead of caching the app.**
Rejected as a substitute — [well-show-pdf-preview.tsx](../../src/pages/ocotillo/thing/well-show-pdf-preview.tsx)
already exists and is a reasonable stopgap, but it is static, loses the map and
hydrograph interactivity, and does not satisfy "any well viewed is cached".

## Consequences

### Positive

- Field staff keep working with no signal; the app opens and pinned wells are complete.
- One interception point (the data provider decorator) covers both Refine hooks and the
  hand-rolled `useWellDetails` query.
- Installability and precaching improve cold-start latency on poor connections even
  when fully online.
- The query-client consolidation removes existing latent ambiguity regardless of
  offline work.

### Negative / costs

- A service worker is a permanent operational hazard: a bad SW can pin users to a stale
  build. Mitigated by `NetworkFirst` on `index.html`, a tested skip-waiting/update
  prompt, and a documented kill switch (ship an SW that unregisters itself).
- Authenticated well data — including attachment bytes — now sits on the device at
  rest, unencrypted, subject to the grace window. This is a security posture change and
  needs sign-off; wipe-on-logout is necessary but not sufficient against a lost device.
- The offline auth grace window means a user whose access is revoked server-side keeps
  reading cached wells until the window lapses.
- Stale data risk: a cached well may show a water level that was superseded. The
  last-synced banner is the mitigation and is mandatory, not decorative.
- Cypress and Vitest suites grow an offline dimension; service workers interfere with
  `cy.intercept` and must be disabled in most specs and exercised deliberately in a few.
- Storage quotas differ sharply across browsers and are hostile on iOS Safari, where
  eviction can occur without user action even with `persist()`.

### Follow-on work this unblocks or requires

- [ADR 0004 — Offline Field Data Capture](0004-offline-field-data-capture.md): the
  write path for the groundwater-level and well-inventory forms.
- API support for a single bundled well-download endpoint, to replace N requests per
  pin with one.
- API support for conditional requests (`ETag` / `If-Modified-Since`) so reconnect sync
  is cheap.

## Validation

- **Unit (Vitest):** bundle serialization round-trip, LRU eviction, quota refusal,
  offline auth grace boundary (just inside / just outside), wipe-on-logout.
- **E2E (Cypress):** pin a well online → force offline via CDP
  `Network.emulateNetworkConditions` → reload → assert the well show page renders from
  cache with a staleness banner; assert an unpinned, never-viewed well renders an
  explicit unavailable state rather than a spinner.
- **Manual field test:** airplane mode on a real device, full pin-then-drive workflow,
  before general rollout.
- **Telemetry:** PostHog `captureEvent` on pin, unpin, offline page view, cache hit,
  and quota refusal — to learn whether pinning is used and how large real bundles get.

## Resolved Questions

### Q1 — Offline auth grace window

**7 days, hard-capped by the refresh token's own expiry, reset by any successful online
session.**

Store `offlineGraceExpiresAt = min(lastSuccessfulRefresh + 7d, refreshTokenExp)` at
every successful token refresh in [authentik-provider.ts](../../src/providers/authentik-provider.ts).
The cap matters: a grace window longer than the refresh token's life produces a user who
can read cached wells but is forced through a full re-auth the moment they reconnect —
strictly worse than expiring the cache with the token.

Seven days is chosen against the actual failure it must survive: a multi-day field
trip. Longer buys little (trips over a week almost always touch connectivity
somewhere), and every extra day extends how long a revoked account keeps reading
authenticated data. Shorter is hostile — a 24-hour window would strand a Tuesday
departure by Wednesday.

Expiry is not silent. At `expires - 24h` the app surfaces a "reconnect within 1 day to
keep offline access" prompt; past expiry, bundles are wiped and the user sees the login
screen with an explanation, not an empty app.

Make the 7 days a build-time constant, not a user setting — a user-adjustable security
window will be set to maximum by everyone and reviewed by no one.

### Q2 — Tile radius and zoom range

**2 km radius, z10 up to each basemap's own `maxzoom`, active basemap only, plus the
themed default (`light`) as a fallback.**

Derivation at NM latitude (φ ≈ 34°, so a tile spans `40,075,017 · cos φ / 2^z` metres);
a 2 km radius is a 4 km box, and worst-case grid alignment needs `floor(4000/span) + 2`
tiles per axis:

| Zoom | Tile span | Tiles per axis | Tiles |
| --- | --- | --- | --- |
| z10 | 32.4 km | 2 | 4 |
| z11 | 16.2 km | 2 | 4 |
| z12 | 8.1 km | 2 | 4 |
| z13 | 4.1 km | 2 | 4 |
| z14 | 2.03 km | 3 | 9 |
| z15 | 1.01 km | 5 | 25 |
| z16 | 507 m | 9 | 81 |
| | | **Total** | **131** |

- **Raster basemaps** (USGS imagery/topo, `maxzoom` 16; shaded relief, 15) reach the
  full 131 tiles. At 30–60 KB per 256px JPEG that is **4–8 MB per well**.
- **Vector basemaps** (OpenFreeMap) serve source tiles only to z14 and overzoom above
  it, so prefetch stops at z14: **25 tiles, ~2 MB**, plus the style JSON, sprite sheet,
  and the glyph PBF ranges the app's symbol layers actually request
  (`DEFAULT_TEXT_FONT` = Noto Sans Regular — one fontstack, a handful of ranges).

2 km, not 1 km, because the well point is often not where the truck parks — access
roads and gates need to be on-screen. Not 5 km, because z16 tile count scales with the
square of the radius: 5 km would be ~500 tiles and ~30 MB per well.

**Budget: 250 MB total, ~10 MB per pinned well worst case → ~25 wells.** Warn at 80%,
refuse new pins at 100% with an actionable message naming the wells to unpin.

iOS Safari is the binding constraint, and it argues for shipping Phase 1's web app
manifest before Phase 3's pinning: an installed PWA gets materially better eviction
treatment than a plain tab, where storage can be reclaimed after a stretch of disuse
regardless of `navigator.storage.persist()`.

### Q3 — Hydrograph history in a pinned bundle

**Full manual series; trailing 12 months of transducer data only.**

The current page fetches *everything* — [well-show.tsx:217](../../src/pages/ocotillo/thing/well-show.tsx:217)
pages through `observation/groundwater-level` at 1000/page and
`observation/transducer-groundwater-level` at 5000/page until exhausted. Those two are
not remotely the same size:

- **Manual** groundwater-level readings are field measurements — monthly to quarterly.
  Decades of record is still only hundreds to low thousands of rows, well under a
  megabyte of JSON. Cache all of it; the whole point of a hydrograph is the long trend.
- **Transducer** data is logger output. At a 15-minute interval that is ~35,000 rows
  per year; a ten-year record is ~350,000 rows and tens of megabytes — several times
  the entire tile budget, for one well.

Twelve months of transducer data preserves a full seasonal cycle, which is what a field
user is actually checking against ("is this level normal for August?"), and keeps the
bundle in the low single-digit megabytes.

The offline chart must label the truncation — "transducer record truncated to 12 months
for offline use" — rather than silently drawing a shorter line than the same well shows
online.

The real fix is server-side downsampling (LTTB or time-bucketed averages) so the full
record fits in a fixed row budget. Track that as an API request; until it exists, the
12-month window is the mitigation. Note that this also makes pinning *cheaper than the
online page load*, which is a nice side effect worth keeping.

### Q4 — Auto-refresh on reconnect

**Foreground + explicit user action, or Wi-Fi. Never silent cellular.**

Auto-sync pinned bundles only when all hold: the app is online, the tab is foregrounded,
and either the connection is known Wi-Fi or the user has opted into cellular sync in the
`/offline` page. `navigator.connection.effectiveType` / `saveData` supply the signal
where available (Chromium/Android); Safari and Firefox do not implement it, so **absent
signal is treated as cellular** — the conservative default.

Rationale: a bundle refresh is multi-megabyte and 25 pinned wells is a ~250 MB sync.
Doing that unprompted on a state-issued metered plan the moment a truck rolls back into
coverage is a bill the user did not agree to.

A manual "Sync all" button in `/offline` is always enabled regardless of connection
type — an explicit tap is consent. Staleness is always visible per well, so a user who
skips syncing is never misled about what they are looking at.

### Q5 — Encryption of cached attachments

**No app-level encryption in v1.** Ship wipe-on-logout, wipe-on-user-switch, and
wipe-on-schema-mismatch instead, and require FDE + MDM on devices that pin.

App-level crypto here would be theater: the key has to live somewhere the app can read
without a server round trip — IndexedDB or `localStorage`, right next to the ciphertext.
Anyone who can read the origin's storage can read the key. It would defeat casual
inspection of the IndexedDB viewer in devtools and nothing else, while adding real
complexity to every read path.

What actually mitigates a lost device is OS full-disk encryption plus a remote-wipe
policy, both of which are device-management concerns, not app concerns.

Concrete requirements this does impose:

- Wipe every offline store on explicit logout, on refresh failing with a real
  `invalid_grant`, and when the incoming token's `sub` claim differs from the one that
  wrote the bundles (user switch on a shared truck tablet).
- Wipe on `schemaVersion` mismatch after a deploy rather than attempting migration.
- **Flag for security review before Phase 3:** the `details` payload includes contacts
  ([ContactsCard](../../src/components/WellShow)), i.e. landowner names and phone numbers.
  Pinning therefore writes third-party PII to the device at rest. Field staff plausibly
  need it, so the recommendation is to include it and bring pinning devices formally
  in scope for the organization's PII handling policy — but that is a call for the data
  owner, not the frontend team. If the answer is no, contacts are dropped from the
  bundle and that card renders "unavailable offline".

Revisit only if a real requirement appears (a regulated attachment class, or a
compliance regime that names at-rest encryption) — and then the answer is likely an
OS-backed key store via a native wrapper, not WebCrypto in the SPA.
