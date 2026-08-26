# ADR 0001 — Contextual Media Mapping (non-well photographs)

**Status:** Proposed
**Ticket:** [BDMS-901](https://nmbgmr.atlassian.net/browse/BDMS-901) (epic: BDMS-815 Ocotillo Feature Requests)
**Date:** 2026-08-06
**Author:** Jake Ross
**Requester:** Stacy Timmons (raised 2026-05-05, AMP/WDI Coordination meeting)
**Deciders:** Data owner (Stacy Timmons), Ocotillo product (Liz Lyons), backend; Amy Trivitt if the Photo Archive route is taken

---

## 1. Context

### The request

Field and office staff accumulate photographs that are **not of a well**:
landscapes, outcrops, people working, site context, regional scenery. They are
wanted for reports, guidebooks, and other publications. The retrieval pattern is
by **place and subject**, not by well:

- "I want all the photos in the Taos area."
- "I want photos of the salt basin."

Three separable capabilities are being asked for:

| # | Capability | Ocotillo today |
|---|---|---|
| C1 | **Store** a photo that has no well | Partial — uploadable with no `thing_id`, lands in an orphan bucket |
| C2 | **Describe** it (place, subject, date, photographer, rights) | No — none of these fields exist |
| C3 | **Retrieve** it by area or subject, in bulk, for publication | No — assets are only queryable by `thing_id` |

### Ocotillo's media model today

- `AssetResponse` ([src/generated/types.gen.ts:56](src/generated/types.gen.ts:56)):
  `name`, `label`, `storage_path`, `mime_type`, `size`, `uri`, `id`,
  `created_at`, `release_status`, `storage_service`, `signed_url`. That is the
  entire descriptive surface.
- `CreateAsset` ([src/generated/types.gen.ts:240](src/generated/types.gen.ts:240)) adds exactly
  one relationship: `thing_id?: number | null`.
- `GET /asset` ([src/generated/types.gen.ts:4025](src/generated/types.gen.ts:4025)) accepts exactly
  one filter: `thing_id`, plus `page`/`size`.
- Assets surface in two places: the per-well **Attachments** card
  ([src/components/WellShow/Attachments.tsx](src/components/WellShow/Attachments.tsx)) and the
  **Unassociated Assets** list
  ([src/pages/ocotillo/asset/unassociated.tsx](src/pages/ocotillo/asset/unassociated.tsx)), which exists to
  *drain* the orphan bucket onto wells rather than to curate a standing
  collection.
- Global search indexes assets by file path and related well names only
  ([docs/search.md](docs/search.md)). A photo of the Taos gorge with a
  camera-generated filename is unfindable by design.
- There is no tag model, no asset geometry, no capture date (`created_at` is
  upload time), no photographer, and no rights field. `release_status` is a
  lifecycle enum, not a publication licence.

**Ocotillo currently models media as an attachment to a thing. The request is
for media as a first-class, place-anchored, subject-tagged object.** Those are
different data models, not a missing filter.

### Product context

Ocotillo's intended scope is a **holistic data management platform for the
Bureau — the model being USGS ScienceBase**: a catalogue of heterogeneous
items, each carrying arbitrary descriptive metadata, attached files, spatial
footprints, and access controls, discoverable through faceted and spatial search
over an API.

This matters for the decision, and §3/D4 develops it. Under that vision, a
place-anchored, subject-tagged asset catalogue is not scope creep — it is a
component of the target architecture that has not been built yet.

### Stack facts that constrain the options

- Frontend: React + Refine + MUI, served as static files from **Google App
  Engine** ([app.yaml](app.yaml)).
- Backend: FastAPI, Postgres.
- Object storage is already pluggable — `storage_service` is typed
  `'gcs' | 's3' | string`
  ([src/interfaces/ocotillo/SearchResult.ts:19](src/interfaces/ocotillo/SearchResult.ts:19)) — and asset
  reads go through 15-minute signed URLs.
- We therefore already operate a bucket, a signed-URL pattern, and an
  OpenAPI-typed client generator.

---

## 2. The incumbent: photoarchive.nmt.edu

The Bureau operates <https://photoarchive.nmt.edu/> — the "NMBGMR Photo &
Document Archive," running **ResourceSpace**. Observed 2026-08-06 by loading it
anonymously:

- **Public.** Content browses and searches with no login.
- **Populated and curated.** Featured collections include *Photo Archive*
  ("Historical photos of fieldwork, mining, and bureau publication photos"),
  *Historic Document Archive*, *Sample Data Repository*, *Subsurface Library
  Logs*, *Core Repository*, **Fieldwork**, *Thin Sections*, *Chip Sets*,
  *Sample Descriptions*, *Hand Samples*, *SOP Documentation*.
- **Geographic search works** — `/pages/geo_search.php`, a Leaflet map with
  "Drag to select a search area."
- **Tag browse, advanced search, and workflow states** are all present.
- **Bulk tooling exists** — search results offer *Edit all resources* and *CSV
  Export - metadata*, with page sizes to 240.

On capability alone this answers BDMS-901. The constraints are what make it
complicated.

### 2.1 Ownership, support, and cost

**The Photo Archive is owned by Amy Trivitt. Additional support is provided
through the Bureau's ICASA database maintenance contract.**

This is a real and ongoing cost to the Bureau, and it should not be treated as
free simply because it does not appear on the Ocotillo team's budget line. Three
consequences follow, and they bear directly on the options in §5:

1. **The cost is real, just borne elsewhere.** "Use the existing system" is not a
   zero-cost option; it is a decision to keep paying an existing cost and to add
   load to it. Any comparison that scores ResourceSpace as "no operational
   burden" is wrong.
2. **A named owner has finite capacity.** Routing a new stream of AMP/WDI field
   photography at the archive is a request on one person's time, not on an
   abstract service.
3. **Contract-mediated support constrains the change cycle.** When meaningful
   changes require scoping against a maintenance contract, iteration is slow and
   discretionary work is expensive. This is a structural explanation for the
   friction described below — it is not a system one iterates with, and
   "customization is not permitted" is the natural consequence of that support
   model rather than an arbitrary policy.

### 2.2 Constraints

Reported by the Ocotillo team:

1. **No customization.** No custom metadata fields, no schema changes, no
   plugins — so no "Ocotillo thing ID" field and no AMP/WDI-specific structure.
2. **Serious friction uploading content.**
3. **Serious friction integrating programmatically.**

Constraint 1 would be survivable on its own: what BDMS-901 asks for is stock
ResourceSpace. Constraints 2 and 3 are different in kind, because ingest and
retrieval *are* the request. §2.4 measures both.

### 2.3 The decisive data point

| Query | Results |
|---|---|
| `Taos` | **340** — "View south from the Rio…", "Winter at Questa…", "Taos Plaza. Taos Pueblo…", "Frances and Dick Jahns at…", "Landslide scars in…" |
| `salt basin` | **0** |

Same system, same working geographic search, same working tag browse.

The 340 is what makes this informative. **Curation demonstrably happens here** —
somebody ingested, described, and keyworded hundreds of historical photographs.
The organisation is willing and able to curate. So the zero is not a motivation
gap or a staffing gap. It is the gap between *that* workflow — an archivist,
working a defined historical collection, inside their own group's tooling — and
*this* one: a field geologist with 400 photos on a phone and an SD card, outside
that group.

> **The photos aren't in the archive because the people who take them have no
> adequate, accessible way to put them there.**

This diagnosis determines the decision:

| If the constraint is… | Then… |
|---|---|
| Curation staffing | Software choice barely matters. Pick the cheapest option, assign a curator, done. |
| **Tooling and access** | **Software choice is the primary lever.** Ingest ergonomics outranks every query feature, and any option that fails to put a usable path in field staff's hands fails regardless of how good its search is. |

This ADR adopts the second reading, and §2.4 substantiates it.

### 2.4 Measured performance

Measured 2026-08-06 from one client, 2–3 repetitions, single location and time
of day. Magnitudes are solid; exact figures are indicative.

**Baselines:** DNS 4 ms · TCP connect 65 ms · TLS handshake 220 ms. A static
thumbnail from `/filestore/` returns in **85 ms** warm, 286 ms cold. The network
path and file server are both healthy.

**Every dynamic request costs ~2.3–2.5 s regardless of what it does:**

| Request | Response size | Time |
|---|---|---|
| `/filestore/…145thm_….jpg` (static) | 7 KB | **85 ms** |
| `/pages/ajax/reload_searchbar.php` | 8 KB | 2.31 s |
| `/api/?function=…` → `401 Invalid signature` | **17 B** | **2.23–2.50 s** |
| `/pages/search.php?search=zzqqxx` (0 results) | 69 KB | 2.37–2.41 s |
| `/pages/geo_search.php` | 88 KB | 2.32–2.34 s |
| `/pages/home.php` | 66 KB | 2.34–2.44 s |
| `/pages/search.php?search=Taos` (340 results) | 237 KB | 2.49–2.53 s |
| `/pages/search.php?search=Taos&per_page=240` | 862 KB | 2.94 s and 10.0 s |

**A 17-byte error response takes 2.25 seconds.** The latency is not query cost,
result-set size, payload, or network — it is a **fixed ~2.2 s bootstrap tax on
every dynamic request**. A zero-result search costs the same as a 340-result
one. The server reports `Microsoft-IIS/10.0`.

**Full page load** (`search.php?search=Taos`, warm cache, Navigation Timing):

- TTFB **3.10 s**, response complete 3.32 s
- **DOMContentLoaded / load: 5.76 s**
- 126 subresources — 36 scripts, 25 stylesheets, 50 images, 4 XHR, each XHR
  paying the full ~2.3 s tax again

**Cold first visit** adds the bot gate below: interstitial (~2.5 s) + a
hard-coded 1 s delay + full reload (~5.8 s) ≈ **9 s before anything usable
appears.**

#### The browser-check gate

Every `/pages/*` URL requested without JavaScript returns a 1,217-byte
interstitial — "Performing browser checks…" — that computes a
`browser_check_cookie` in obfuscated JS and reloads after a fixed 1 s delay.
Plain HTTP clients (`curl`, `axios`, `requests`) receive this indefinitely and
never reach content. **This is the mechanical explanation for the reported
integration friction:** scripting against the HTML interface cannot work.

Two qualifications, both established by testing:

- **`/api/` is exempt.** Plain curl with no JS and no cookie reaches it and
  receives a genuine `401 Invalid signature`. The ResourceSpace API is enabled
  and reachable — it needs a key, not a workaround.
- **CORS is locked to its own origin**
  (`access-control-allow-origin: https://photoarchive.nmt.edu`). Ocotillo cannot
  call it from the browser; integration must be **server-to-server** through the
  FastAPI backend.

#### Interpretation

1. **The friction is real, measurable, and structural** — not a training
   problem. A tool where every click costs 2.5 s, a results page takes 5.8 s,
   and a first visit takes ~9 s will not attract someone with 400 photos to
   upload.
2. **Bulk work is worst hit.** The 240-per-page view — where a real curation
   session would live — returns 862 KB and took 2.9 s and 10.0 s on consecutive
   tries. A field season's metadata work means hundreds of such round trips.
3. **Integration is possible but constrained:** server-to-server, keyed, ~2.5 s
   per call. Adequate for a nightly sync; not for a live "related media" panel.
4. **The cause is likely fixable, and not by us.** A fixed per-request bootstrap
   cost alongside fast static delivery points at PHP process startup, opcode
   caching, session handling, or the IIS/PHP configuration — not at capacity.
   Per §2.1, however, acting on it means scoping work against the ICASA
   contract, which is precisely the slow, expensive path.

---

## 3. Decision drivers

- **D1 — Retrieval by place is the requirement.** Ocotillo cannot do it at all.
  Whatever wins must answer a bbox or named-place query.
- **D2 — Publication use implies rights management.** Guidebooks and reports
  need photographer, credit line, and usage terms. Legal exposure, not polish.
- **D3 — The binding constraint is the absence of adequate, accessible tooling
  for staff** (§2.3, §2.4). **Adequate**: describing a photo costs seconds, not
  minutes; bulk operations exist; EXIF/GPS is harvested rather than retyped.
  **Accessible**: the person who took the photo can deposit it themselves,
  today, without an account request or a gatekeeper. Rank every option on this
  first.
- **D4 — A described, place-anchored asset catalogue is on-mission for
  Ocotillo.** Ocotillo is intended as a holistic Bureau data management platform
  on the ScienceBase model (§1). ScienceBase is precisely a catalogue of items
  with arbitrary metadata, attached files, spatial footprints, faceted and
  spatial search, permissions, and an API — and USGS built it rather than
  delegating that role to a digital asset manager. Under this vision, C1–C3 are
  **capabilities the platform is expected to have**, not a foreign concern
  bolted onto a well database. This driver argues *for* Ocotillo holding this
  data, and it is the strongest single argument in the document.
- **D5 — One home per asset.** Two systems both claiming "the photos" guarantees
  drift, duplicate storage, and "which copy is current?" Combined with D4, this
  argues that the home should be the platform intended to be holistic.
- **D6 — Some non-well photos are scientific context.** The access road, the
  wellhead surroundings, the crew installing a transducer — that is evidence
  about a site visit, and Ocotillo is the only system that holds it in context.
- **D7 — Integration cost is a first-class criterion.** Any option must be
  reachable from an OpenAPI-typed FastAPI/React stack. Per §2.4, the incumbent
  is reachable only server-to-server, keyed, at ~2.5 s per call.
- **D8 — Total Bureau cost, not team cost.** Per §2.1, ResourceSpace consumes
  Amy Trivitt's time plus ICASA contract capacity. Options must be compared on
  what the Bureau spends and on who is blocked, not on which budget line the
  cost appears against.
- **D9 — Build cost and permanence are real.** D4 makes an Ocotillo catalogue
  on-mission; it does not make it small. §8 is genuine multi-sprint work across
  backend, frontend, and search, and every future asset change will carry these
  use cases as constraints. ScienceBase is a substantial system with a
  substantial team behind it.

---

## 4. The boundary rule

Independent of which system holds the files. "Not of the well" is used for two
different things:

- **Not of the well, and not about any site** — landscapes, regional scenery,
  outcrops, people working, "the Taos area" → the general asset catalogue.
- **Not of the wellhead, but about a specific site or visit** — the access road,
  surrounding terrain, the crew installing equipment at a named well → attached
  to the well or field activity. This is provenance (D6).

Instructing staff that "non-well photos go elsewhere" without this distinction
would lose site-context photography that has real scientific value.

This rule is a deliverable of this ADR alongside any code, and it can be written
and socialised immediately.

---

## 5. Options

### Option A — Extend Ocotillo into a described, place-anchored asset catalogue

Add tags, geometry, capture date, photographer, rights, and spatial/faceted
browse to the asset model. Sketch in §8.

- **Pros:** **on-mission (D4)** — this is a component of the ScienceBase-style
  platform Ocotillo is meant to be, not a diversion from it, and USGS's own
  answer to the same problem was to build rather than delegate. Total schema
  control, which no external system offers. No cross-team dependency and no
  contract-mediated change cycle (D8). Nothing to integrate (D7). Media sits
  beside the scientific record; one login, one UI, one search. Ingest ergonomics
  are entirely within our control, which is the only way to guarantee D3 is
  actually met.
- **Cons:** substantial, permanent build and maintenance (D9). Adds a second
  Bureau-level home for photographs unless the relationship with the Photo
  Archive is explicitly settled. Does not by itself solve the historical
  backlog.

### Option B — Fix the ResourceSpace relationship

Keep photoarchive.nmt.edu and address constraints 2 and 3: a bulk-ingest path,
upload accounts for AMP/WDI staff, an API key, and the §2.4 latency.

- **Pros:** no new system, and everything is already live and public, so outside
  requesters get a URL rather than asking staff for an export. Preserves a
  working archive with real curated content.
- **Cons:** dependent on Amy Trivitt's capacity and on ICASA contract scope
  (D8), which makes the change cycle slow and each change discretionary.
  Constraint 1 persists even in the best case — no custom fields, ever, so no
  Ocotillo linkage and no AMP/WDI-specific structure. Leaves C1–C3 outside the
  platform that is supposed to be holistic (D4).
- **Access is not tooling (D3).** Handing staff logins to the same system
  addresses *accessible* and leaves *adequate* untouched. Given §2.4, accounts
  alone change nothing; the per-request latency must be fixed too, and per §2.1
  that fix runs through the contract.

### Option C — Adopt a third-party DAM that Ocotillo can integrate with

Stand up a separate system chosen for ingest ergonomics and API quality.
Candidates in §6.

- **Pros:** better ingest and integration than the incumbent without building a
  catalogue from scratch. Most candidates are a deployment and a configuration.
- **Cons:** a third home for Bureau imagery, with its own operations, patching,
  backups, and cost (D8). Cuts directly against D4 and D5 — it moves platform
  capability *out* of the platform. Weakest strategic fit of the three, and
  worth pursuing mainly as a component or a fallback rather than as a
  destination.

### Option D — The public website

Publish curated galleries as web content.

- **Pros:** no new systems; adequate for a hand-picked "best of" set.
- **Cons:** a publishing surface, not a repository. No queryable metadata, no
  embargo handling, no bulk retrieval, no provenance. Useful downstream of
  whatever wins, not instead of it.

### Option E — Capture and describe in Ocotillo, decide custody separately

Treat "how do photos get described?" and "where do photos ultimately live?" as
separate questions, and answer the first one now.

Ocotillo becomes the **capture surface**: bulk drop-upload, EXIF/GPS harvested
automatically, place and subject applied across a selection in one action,
photographer defaulted from the logged-in user. Where the files ultimately live
— Ocotillo's own catalogue (A), the Photo Archive (B), or a third-party DAM (C)
— stays open.

- **Pros:** attacks *adequate* and *accessible* simultaneously (D3), in the one
  place where we control the ergonomics completely. **Metadata is cheapest at
  the moment of capture and grows more expensive monotonically afterwards** —
  EXIF GPS and timestamp are in the file now, the photographer is known now, and
  which basin it is is in someone's head now; a week later that costs an
  interview, a year later it is unrecoverable. It is the first increment of
  Option A under any reading, so no work is wasted, and it composes with B and C
  as a push source if either is chosen instead.
- **Cons:** on its own it defers the custody question rather than answering it,
  so the §4 boundary rule must be crisp from day one. If custody lands outside
  Ocotillo, a push integration is still required (D7).

---

## 6. Reference model and third-party candidates

### ScienceBase as the reference model

Since Ocotillo's target is a ScienceBase-style platform, it is worth naming what
that model actually provides, because it is close to a specification for Option
A:

- items with **arbitrary descriptive metadata**, not a fixed schema;
- **file attachments** on items, with the item — not the file — as the unit of
  description;
- **spatial footprints** and map-based discovery;
- **hierarchical collections** and faceted browse;
- **permissions** per item and per collection;
- a **REST API** as a first-class interface, not an afterthought.

Mapped onto §8: tags and place are the metadata layer, `asset.geometry` is the
footprint, collections are the hierarchy, `release_status` plus
`asset.usage_rights` are the permission and rights layer, and the API extensions
are the interface. The notable point is that USGS built this rather than
adopting a DAM — the same conclusion D4 points at here.

### Third-party candidates (Option C, or as components)

> Product details are from general knowledge; licences and feature sets change.
> Verify current terms before committing. The evaluation criteria are the
> durable part.

**Directus** — open-source (BSL) headless data platform, Postgres-backed. An
asset library where **you define the metadata fields**, with REST and GraphQL
over a real OpenAPI spec, so Ocotillo's existing `openapi-ts` generator produces
a typed client for free (D7). GCS and S3 adapters reuse the bucket pattern
already in place; on-the-fly transforms replace the derivative work in §8; bulk
upload and bulk edit address D3. Watch the Business Source licence (free below a
revenue threshold a state agency clears comfortably — confirm), and note that
geographic query is a PostGIS concern with the map UI still ours to build.
**Most interesting not as a separate archive but as a possible implementation
substrate for Option A's metadata layer**, which would trade build effort for an
operational dependency.

**Cloudinary** — SaaS media API. Zero operations, strong delivery and
transforms, structured metadata, a real search API, and **AI auto-tagging**,
which attacks D3 in a way no self-hosted option does. Usage-based cost scaling
with bandwidth, and not an archival or preservation system, so originals should
remain in the Bureau's own bucket. Best considered as a delivery and
enrichment layer over our own storage rather than as the system of record.

**STAC + `stac-fastapi`/`pgstac`** — the request is fundamentally spatiotemporal
asset search, and STAC makes "all photos in the Taos area between these dates" a
first-class standards-based query on the FastAPI/PostGIS stack the backend
already runs. But it is a catalog spec, not a DAM: no upload UI, no curation
workflow, no bulk editor, no rights. Excellent on D1 and D7, contributes nothing
to D3. Worth considering as an **interoperability layer over Option A**, not as
a store.

**Omeka S** — digital-collections publishing with item sets, Dublin Core, linked
data, a REST API, and a mapping module. Curation-first rather than
bulk-ingest-first. Good for *published collections*, weaker as a working
repository for a field season's raw output.

**InvenioRDM** — research data repository behind Zenodo. Relevant only if photo
sets should be **citable** (DOIs, versioning, embargoes). Heavy to operate and
deposit-oriented.

**Lower priority:** Payload CMS (MIT, Node/TS, good if the media service should
live in a TypeScript codebase adjacent to the frontend); GeoNode
(domain-appropriate but layer-oriented and heavy); Nuxeo, Pimcore, and
CollectiveAccess (capable, high configuration burden). **Not recommended:**
Bynder, Canto, Brandfolder, Acquia DAM — brand-asset oriented, expensive,
procurement-heavy, weak on geoscience metadata.

### Comparison

Columns are ordered by weight. Ingest ergonomics and self-service are decisive
(D3); strategic fit reflects D4 and D5. **Operational burden is scored as cost
to the Bureau, not to the Ocotillo team** (D8).

| | Ingest (D3) | Staff self-serve (D3) | Integration (D7) | Place query (D1) | Rights (D2) | Bureau ops cost (D8) | Strategic fit (D4/D5) |
|---|---|---|---|---|---|---|---|
| Ocotillo catalogue (A) | ✅ fully ours to design | ✅ already logged in | ✅ native | 🔴 to build | 🔴 to build | ⚠️ our build + run (D9) | ✅ **on-mission** |
| Ocotillo capture (E) | ✅ fully ours to design | ✅ already logged in | ✅ native | — deferred | — deferred | ✅ low | ✅ first increment of A |
| ResourceSpace (incumbent) | 🔴 ~2.5 s/request, 5.8 s pages | 🔴 gated by another group | 🔴 keyed + slow; HTML unscriptable | ✅ live geo search | ✅ | ⚠️ **Amy Trivitt + ICASA contract** | 🔴 capability outside the platform |
| Directus | ✅ bulk upload + bulk edit | ✅ we control accounts | ✅ OpenAPI/REST/GraphQL, GCS adapter | ⚠️ PostGIS, map UI ours | ✅ custom fields | ⚠️ another system to run | ⚠️ unless used as A's substrate |
| Cloudinary | ✅ + AI auto-tagging | ✅ we control accounts | ✅ strong API/SDKs | ⚠️ metadata-based | ⚠️ custom fields | ⚠️ usage-based spend | ⚠️ layer, not system of record |
| STAC + stac-fastapi | 🔴 no ingest UI | 🔴 none | ✅ same stack | ✅ native bbox + datetime | 🔴 | ⚠️ medium | ⚠️ layer over A |
| Omeka S | ⚠️ curation-first | ⚠️ archivist-oriented | ✅ REST API | ⚠️ mapping module | ⚠️ | ⚠️ medium | 🔴 third home |
| InvenioRDM | ⚠️ deposit-oriented | ⚠️ deposit ceremony | ✅ REST API | 🔴 | ✅ + DOIs | 🔴 high | 🔴 third home |

---

## 7. Decision

**Build the capture path now (Option E) as the first increment of Option A, and
settle the relationship with the Photo Archive in parallel.**

1. **Adopt and publish the §4 boundary rule.** Costs nothing, depends on nobody,
   prevents further orphan accumulation. Ocotillo work: an upload-time hint on
   [AttachmentsUploadDialog.tsx](src/components/WellShow/AttachmentsUploadDialog.tsx) and a third
   disposition on
   [the Unassociated Assets page](src/pages/ocotillo/asset/unassociated.tsx), which currently
   offers only attach-or-delete.

2. **Build the capture and describe path in Ocotillo** — bulk drop-upload for
   photos with no `thing_id`; **automatic EXIF extraction** (GPS → geometry,
   timestamp → `captured_at`, camera and author where present); place and
   subject applied across a multi-selection in one action; photographer
   defaulted from the logged-in user. This is the direct answer to D3, it is
   on-mission under D4, and it is the only step that depends on nobody outside
   this team. It is the 🅔 subset of §8.

3. **Settle the Photo Archive relationship, in parallel and without blocking
   step 2.** Two questions for Amy Trivitt: whether AMP/WDI field photography
   should be routed there at all, and whether the ~2.2 s per-request tax can be
   addressed within ICASA contract scope. The answers determine whether the
   Bureau ends up with one photo home or two, and that is a governance question
   the data owner should decide explicitly rather than by default (D5, D8).

4. **Complete Option A** — browse, faceted and spatial search, rights fields,
   bulk export — as the platform's asset-catalogue capability, scheduled against
   the broader ScienceBase-model roadmap rather than as a one-off response to
   this ticket. §8 lists the work; D9 is the honest counterweight, and the
   sequencing should reflect it.

5. **Consider third-party components rather than third-party destinations.**
   Directus as a possible substrate for A's metadata layer, Cloudinary as a
   delivery and auto-tagging layer, STAC as an interoperability layer — each
   evaluated on whether it reduces §8's build without moving platform capability
   out of the platform. A standalone third-party DAM (Option C as a destination)
   is the weakest strategic fit and should not be pursued unless steps 2 and 4
   both prove infeasible.

Step 2 is deliberately not gated on step 3. Gating it would leave the actual
constraint unaddressed for the duration of a cross-team negotiation, and photos
taken in the interim would lose their cheapest-to-capture metadata permanently.

The §4 boundary rule holds throughout: media whose subject is a well, spring,
location, or field activity attaches to that record; media whose subject is a
place or a scene goes to the general catalogue.

---

## 8. Option A implementation sketch

Items marked **🅔** are the capture slice built in step 2. They are the smaller
half and the only half that addresses D3.

### Data model

- 🅔 `asset.tags` — many-to-many to a controlled vocabulary. Free-text tags
  become unusable within a year; a `lexicon`-style table has precedent
  ([src/interfaces/ocotillo/ILexicon.ts](src/interfaces/ocotillo/ILexicon.ts)).
- 🅔 `asset.geometry` — point (optionally extent) with a spatial index, from
  EXIF GPS on upload where present and manual placement otherwise. Reuse the
  `LocationGeoJsonResponse` shape so existing map components consume it
  unchanged.
- 🅔 `asset.captured_at` — distinct from `created_at`, which is upload time.
- 🅔 `asset.photographer` — plausibly a FK to `contact`, which already exists.
- `asset.usage_rights` — licence enum plus free-text restrictions.
  `release_status` must not be overloaded for this; it is a lifecycle field, and
  conflating the two produces a rights bug (D2).
- `asset.place_id` — a gazetteer of named informal areas ("Taos area", "salt
  basin"). Without it, "the salt basin" is answerable only as a hand-drawn
  bounding box. The component most likely to be underestimated, and the one that
  most directly serves the original request.

### API

- Extend `GET /asset` beyond `thing_id`: `tag`, `bbox`, `place_id`,
  `captured_after`/`captured_before`, `mime_type`.
- Bulk-download endpoint (zip of a selection). The publication workflow is "give
  me all of these"; one-at-a-time downloads make it unusable.
- Derivative sizes (thumb / web / original). The 15-minute signed-URL pattern
  needs revisiting for galleries of hundreds of images.
- Extend the search index to cover tags, captions, and place names; today it
  covers storage path and related well names only ([docs/search.md](docs/search.md)).

### UI

- A **Media** section in navigation ([src/config/navigation.ts](src/config/navigation.ts)),
  separate from the well-scoped Attachments card.
- Gallery browse with tag facets and date filter; map browse via the existing
  OGC layer components; multi-select to bulk download.
- 🅔 Metadata editor: tags, place, capture date, photographer, rights. **Bulk
  edit is mandatory** — per-file editing will not survive a 400-photo field
  season.
- 🅔 Upload flow reworked for the no-thing case; today's path assumes a well
  ([AttachmentsUploadDialog.tsx](src/components/WellShow/AttachmentsUploadDialog.tsx)) and everything
  else falls into the unassociated bucket.

---

## 9. Open questions

1. **🔴 Should AMP/WDI field photography be routed to the Photo Archive at all,
   and does the Bureau want one photo home or two?** For Amy Trivitt and the
   data owner jointly. This is a governance decision that should be made
   explicitly (D5, D8), and it determines steps 3–5 of §7.
2. **Can the ~2.2 s per-request tax be addressed within ICASA contract scope?**
   Narrow and concrete: static files serve in 85 ms while a 17-byte API error
   takes 2.25 s, pointing at PHP bootstrap, opcode caching, session handling, or
   the IIS/PHP configuration rather than capacity. Worth asking regardless of
   which option wins, since the archive continues to serve the historical
   collection either way.
3. **What is the current cost and capacity of Photo Archive support?** Needed to
   compare options honestly under D8 — the ICASA contract line plus Amy
   Trivitt's time, against the build and run cost of §8.
4. **What else went wrong on upload?** §2.4 measures the site from outside, but
   the upload path requires a login. Watch one person load a field season's
   photos and time it. The answer indicates what *not* to reproduce in step 2.
5. **How does the asset catalogue fit the broader ScienceBase-model roadmap?**
   If items with arbitrary metadata and spatial footprints are coming anyway,
   §8's data model should be designed as the general case rather than as a
   photo-specific feature (D4). This materially affects the schema.
6. **Who curates the historical backlog?** Worth naming a person, but scoped
   correctly — per §2.3 this is a backlog question, not the explanation for the
   `salt basin` zero going forward. It should not substitute for fixing the
   tooling.
7. **Volume and backlog.** How many non-well photos exist, and where — personal
   drives, shared drives, Ocotillo's unassociated bucket? Hundreds versus tens
   of thousands changes the sequencing.
8. **Rights and licensing posture.** Works-for-hire owned by the Bureau?
   Third-party or contributed photos with constraints? What credit line do
   publications need? (D2.)
9. **Does the §4 boundary rule survive contact with staff?** Walk a real mixed
   batch from a recent field season past it. If people cannot apply it
   consistently, rewrite it before publishing it.

---

## 10. Consequences

**Common to every branch:**

- Staff learn one boundary rule. It must appear at upload time or it becomes
  folklore and the orphan bucket refills.
- Tooling is the constraint, so tooling work is the lever (D3). A cheap option
  that leaves ingest friction in place is not actually cheap — it defers the
  cost onto staff, where it is invisible and paid in photos that never get
  archived.
- The Photo Archive continues to hold the historical collection and continues to
  cost Amy Trivitt's time and ICASA contract capacity regardless of what
  Ocotillo builds (D8). This ADR does not propose retiring it.

**Step 2 (capture path):** field staff get a usable path in the tool they
already have open, and capture-time metadata — GPS, timestamp, photographer,
context — stops being lost. Realised regardless of how custody resolves, and it
depends on nobody else.

**Completing Option A:** Ocotillo gains a platform capability it is expected to
have under the ScienceBase model (D4), with full schema control and no
contract-mediated change cycle. The cost is a genuine multi-sprint build and a
permanent maintenance obligation (D9), and every future asset change will carry
these use cases as constraints. The Bureau should decide deliberately whether
this makes the Photo Archive the historical-collections system and Ocotillo the
active-data platform, or whether both are expected to serve the same purpose.

**If the Photo Archive route is taken instead:** no new system to run, and a
public URL to hand to outside requesters — but C1–C3 stay outside the platform
that is meant to be holistic, no Ocotillo linkage is possible without custom
fields, and both the latency fix and any future change run through the ICASA
contract.

**Revisit this ADR if** the ScienceBase-model roadmap changes, if the §2.4
latency is resolved, if Photo Archive ownership or support arrangements change,
if backlog volume proves an order of magnitude off the assumption, or if staff
cannot apply the §4 boundary rule consistently.

---

## Appendix A — ADR conventions

First ADR in this repository. Convention: `docs/adr/NNNN-kebab-title.md`,
four-digit sequence, never renumbered. Status is one of `Draft`, `Proposed`,
`Accepted`, `Rejected`, or `Superseded by NNNN`. Superseding ADRs link back;
superseded ones are kept, not deleted.

## Appendix B — Evidence and method

**Observed directly**, 2026-08-06, by loading photoarchive.nmt.edu anonymously
(no login, read-only):

| Observation | Source |
|---|---|
| Runs ResourceSpace | "Powered by ResourceSpace" footer link |
| Public read access | Content browses with the "Log in" link unused |
| Geographic search | `/pages/geo_search.php` — Leaflet, "Drag to select a search area" |
| Advanced search | `/pages/search_advanced.php` |
| Tag browse, workflow states | Left navigation |
| Collections | Photo Archive, Historic Document Archive, Sample Data Repository, Subsurface Library Logs, Core Repository, Fieldwork, Thin Sections, SOP Documentation, Chip Sets, Sample Descriptions, Hand Samples |
| Bulk tooling | Search results → Actions: "Edit all resources", "CSV Export - metadata"; up to 240 per page |
| `search.php?search=Taos` | 340 results |
| `search.php?search=salt+basin` | 0 results |

**Performance method (§2.4):** request timings via `curl` write-out (DNS, TCP,
TLS, TTFB, total) and via in-page `fetch()` with `cache: 'no-store'`, 2–3
repetitions per endpoint; page-level figures from the Navigation Timing and
Resource Timing APIs on a warm cache. Single client, single location, one time
of day. Response headers and the browser-check interstitial were read directly
from `curl` output. No authentication was used and no access control was
circumvented; the JavaScript challenge was satisfied only by a real browser
loading the site normally.

**Taken as given** (reported by the Ocotillo team, not independently verified):
Photo Archive ownership by Amy Trivitt and support via the ICASA database
maintenance contract; no customization permitted; friction uploading content and
integrating programmatically; and Ocotillo's intended scope as a holistic
ScienceBase-model data platform. §2.4 corroborates the integration and
performance claims and identifies mechanisms.

**Product claims in §6** are from general knowledge and were not tested against
this stack. Licences and feature sets change; verify before committing.
