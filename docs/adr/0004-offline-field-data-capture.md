---
generated-by: claude-opus-5
generated-on: 2026-08-07
prompted-by: jakeross
---

# ADR 0004 — Offline Field Data Capture (Groundwater Level + Well Inventory)

**Status:** Draft
**Ticket:** none yet.
**Date:** 2026-08-07
**Deciders:** OcotilloUI frontend team, Ocotillo API team
**Scope:** cross-repo — `OcotilloUI` (this repo, outbox + form refactors) and
`OcotilloAPI` (idempotency contract, without which this ADR should not ship — see D2).
**Depends on:** [ADR 0003 — Offline Well Viewing](0003-offline-well-viewing.md)

## Context

ADR 0003 makes wells *readable* without a network. It explicitly excludes writes. This
ADR covers the other half of the field workflow: recording a measurement or inventorying
a new well while standing at a site with no signal.

Two forms are in scope:

- **Groundwater level** ([groundwater-level-form](../../src/pages/ocotillo/groundwater-level-form)) —
  the high-frequency case. A technician visits a known well and records a depth-to-water
  reading.
- **Well inventory** ([well-inventory-form](../../src/pages/ocotillo/well-inventory-form)) —
  the low-frequency, high-effort case. A new well is characterized from scratch:
  location, construction, screens, landowner contacts, photos.

Today both fail hard offline: the submit mutation throws, the user sees "Failed to
Submit Form — please check your input and try again later", and the entered data exists
only in React state until the tab is closed. The de facto workaround is paper.

### What makes this hard

Neither form is a single request. Both are **client-orchestrated, non-transactional
chains where each step depends on an ID the server just generated.**

**Groundwater level** ([groundwater-level-form.service.ts](../../src/pages/ocotillo/groundwater-level-form/groundwater-level-form.service.ts)) —
two steps:

```
POST sample                        -> sampleResponse.data.id
POST observation/groundwater-level  (sample_id = that id)
```

**Well inventory** ([well_inventory.service.ts](../../src/pages/ocotillo/well-inventory-form/well_inventory.service.ts)) —
`1 + 1 + N + M + P` steps, all sequential:

```
POST ocotillo.location            (only when locationMode === 'new')  -> locationId
POST ocotillo.thing/water-well    (location_id)                       -> wellId
POST ocotillo.thing/well-screen   x N  (thing_id = wellId)
POST ocotillo.contact             x M  (thing_id = wellId)
POST ocotillo.asset               x P  (thing_id = wellId, storage_path, uri)
```

A failure at step *k* leaves steps `0..k-1` committed on the server with no rollback.
That is already true online — offline replay makes it far more likely, and adds
duplicate-on-retry as a new failure mode.

### Other constraints found in the code

| Fact | Location | Implication |
| --- | --- | --- |
| Asset files upload via multipart `POST asset/upload` **at file-selection time**, not at submit; the returned `storage_path`/`uri` is then written into the asset record | [CreateEditAsset.tsx:78](../../src/components/form/asset/CreateEditAsset.tsx:78) | Offline, there is nothing to upload *to*. Blobs must be held locally and uploaded at drain time |
| `@TODO change the well inventory form to only upload new asset on form submit, not on file selection` | [index.tsx:638](../../src/pages/ocotillo/well-inventory-form/index.tsx:638) | Already a known defect; becomes a hard prerequisite here |
| Well selection in the GWL form queries the API for things | [SelectThingComponent](../../src/components/form/thing/SelectThingComponent.tsx) | Offline the picker must be backed by the ADR 0003 bundle store |
| Submission is a bare `useMutation` with notification side effects and `setCreatedWellId` on success | [index.tsx:155](../../src/pages/ocotillo/well-inventory-form/index.tsx:155) | "Success" currently means "server committed". Queuing changes what success means, and the UI must say so |
| Every resource carries a `release_status` | both services | Queued records need provenance distinguishable from live ones |
| `deleteOne` is unimplemented in the data provider | [ocotillo-data-provider.ts:327](../../src/providers/ocotillo-data-provider.ts:327) | No client-side compensating delete is available to unwind a partial chain |

### Non-goals

- **Offline edits.** `PATCH` against an existing record has genuine conflict semantics
  (two technicians, one well, divergent values). v1 queues **creates only**. This
  restriction is what keeps the design tractable — it means there is no merge, no
  last-write-wins policy, and no vector clocks.
- Offline delete (the provider does not implement it at all).
- Bulk/CSV import while offline.
- Any change to how *online* submissions behave, beyond the asset-upload timing fix.

## Decision

Adopt a **durable outbox of whole form submissions**, replayed by re-running the existing
service functions when connectivity returns.

### D1 — The queued unit is a submission intent, not an HTTP request

Store the *validated form payload* — the same object `createGroundwaterLevelForm` or
`createWellInventoryForm` already takes — in IndexedDB, together with its file blobs.
At drain time, run the real service function against the live API, resolving
server-generated IDs then, in order, as it does online.

```
outboxSubmission {
  id,                  // client UUID; also the idempotency key
  kind,                // 'groundwater-level' | 'well-inventory'
  payload,             // the validated IGroundwaterLevelForm / IWellInventoryForm
  files: [{ fieldPath, filename, contentType, blob }],
  capturedAt,          // when the technician hit submit, in the field
  status,              // 'pending' | 'draining' | 'failed' | 'done'
  attempts, lastError,
  progress: { location?: id, well?: id, screens: [id], contacts: [id], assets: [id] },
  schemaVersion
}
```

The rejected alternative — queuing individual HTTP calls with client-generated primary
keys and remapping IDs on drain — requires the server to accept client-supplied IDs. It
does not, and asking for that is a much larger API change than asking for idempotency
keys.

### D2 — Every submission carries an idempotency key, and the API must honor it

The client generates a UUID at queue time and sends it on **every request in the chain**
(header `Idempotency-Key`, scoped per step, or a `client_submission_id` column — the API
team's call). Without server-side deduplication, a request that succeeds but whose
response is lost to a dying connection produces a duplicate record on retry, and
duplicate water-level observations corrupt the science.

**This is the critical-path dependency for the whole ADR.** If it cannot ship, the
fallback is a pre-drain "does a record with this `capturedAt` + `thing_id` already
exist?" probe plus a manual review queue — a mitigation, not a fix, and it does not
close the race.

### D3 — Chains are resumable, not restartable

Refactor both service functions from straight-line `await` sequences into ordered step
lists whose outputs are recorded in `progress` as each step commits. A drain that dies
after creating the well resumes at screens; it does not create a second well.

This is the single largest code change in the ADR and it improves the online path too —
today, an inventory submission that fails at contact 3 of 5 silently leaves a well and
two contacts behind with no way to finish.

### D4 — Asset bytes are held locally and uploaded at drain

Do the existing `@TODO` first: move `POST asset/upload` from file-selection to submit.
Offline, the `File` is written to IndexedDB and uploaded at drain time, before the asset
record that references its `storage_path`.

Cap per-submission attachment bytes (proposed: 50 MB) and warn when a photo set
approaches it. Field photos from a modern phone are 3–5 MB each, so this is roughly a
dozen photos per well — generous for inventory, and bounded.

### D5 — Offline well selection is restricted to the offline store

The GWL form's well picker reads from the ADR 0003 bundle store when offline. **You can
only record a groundwater level offline against a well that was pinned or previously
viewed.** This is a real workflow constraint and must be taught: pin your route before
you leave.

The inventory form is unaffected when `locationMode === 'new'` (it creates everything).
When offline, the "use existing location" branch is disabled, since it needs a location
lookup the device cannot perform.

### D6 — Queued is not submitted, and the UI never pretends otherwise

The success screen after an offline submit says *saved on this device, not yet sent*,
with the pending count and a link to a queue view. `setCreatedWellId` and the
navigate-to-well affordance are suppressed for queued inventory submissions — there is
no well ID yet.

A persistent badge shows the pending count. The queue view lists each submission with
its captured time, status, and last error, and offers retry-now, edit, and discard.

### D7 — Drain policy: automatic, foregrounded, visible

Drain on reconnect while the app is foregrounded. Unlike ADR 0003's *download* of
pinned bundles, this is small outbound data the user actively wants delivered, so
cellular is fine by default — except that submissions carrying more than ~10 MB of
attachments wait for Wi-Fi unless the user taps send-now.

Retry policy:

- **Network error / 5xx / timeout** — exponential backoff (30 s, 2 m, 10 m, 1 h),
  capped at 6 attempts, then dead-letter.
- **401** — refresh the token once and retry; if refresh fails, hold the queue and
  prompt for login rather than dead-lettering. Field data must never be lost to an
  expired session.
- **4xx other than 401/429** — dead-letter immediately. A 422 will not become valid by
  being retried.

Dead-lettered submissions are never silently dropped and never retried forever. They
surface a notification and land in the queue view for a human to fix and requeue or
discard.

### D8 — Pending submissions block logout and survive everything else

ADR 0003 wipes offline stores on logout, user switch, and schema mismatch. The outbox is
the exception:

- Logout with a non-empty queue requires an explicit confirmation naming the count and
  offering to drain first. Prefer blocking over losing.
- The outbox is **never** evicted for storage pressure — it takes priority over cached
  well bundles, which are re-downloadable. Field data is not.
- A schema-version bump must migrate the outbox, not clear it. If a payload genuinely
  cannot be migrated, export it as JSON to the user rather than deleting it.

### D9 — Provenance is recorded server-side

Queued records carry `captured_at` (when the technician submitted in the field) distinct
from server `created_at` (when it arrived, possibly days later), plus a flag marking
offline capture. The scientific timestamps the user typed —
`observation_datetime`, `sample_date` — are already user-entered and unaffected, but QA
needs to be able to tell a record that sat in a truck for a week from a live one.

### D10 — Offline well inventory consumes pre-minted well IDs

[ADR 0002 — Well ID Minting Service](0002-well-id-minting-service.md) exists precisely
because technicians type well identifiers by hand, offline, with no uniqueness
enforcement — two people can independently pick `WL-0047`. That is the same trip, the
same technician, and the same lack of connectivity this ADR is about, so the two
features are not independent:

- When the inventory form is filled offline, its `well.name` field should draw from the
  batch of IDs minted for the trip on the Field Planning page, not from free text.
  Minting happens *online, before departure* — the same pre-trip step as pinning wells
  under [ADR 0003](0003-offline-well-viewing.md), and it should be presented as one
  workflow rather than two unrelated chores.
- Minted IDs must therefore be cached on-device alongside pinned bundles, with local
  bookkeeping of which have been consumed by queued submissions so the form does not
  hand the same ID to two wells inventoried on the same day.
- If ADR 0002 does not ship, offline inventory still works — it just inherits the
  existing collision risk, now with a longer window between capture and the server
  seeing the name. Worth saying plainly: **offline capture makes the collision problem
  ADR 0002 describes strictly worse**, because the duplicate is not discovered until
  drain, potentially days later, when the technician has left the site.

Neither ADR blocks the other. But sequencing 0002 first means the offline inventory form
ships with the collision already solved rather than deferred.

### Phasing

1. **Prerequisites (no offline behavior yet).** Move asset upload to submit time
   (D4's `@TODO`); refactor both services into resumable step lists (D3); land the
   idempotency contract with the API team (D2).
2. **GWL outbox.** Two steps, no blobs, highest field frequency. Ship it behind a flag
   and field-test it before touching inventory.
3. **Inventory outbox.** N-step chains plus attachment blobs; queue view; logout guard.
4. **Polish.** Background Sync as a progressive enhancement on Chromium; queue export;
   dead-letter review tooling.

## Alternatives Considered

**A. Service Worker Background Sync API as the primary mechanism.**
Rejected as primary, kept as a Phase 4 enhancement. Safari/iOS does not implement it, and
field devices include iPads. It also drains outside the app's React context, which fits
single fire-and-forget requests but fits multi-step chains with progress UI and
dead-letter handling poorly.

**B. Per-request queue with client-generated UUID primary keys and ID remapping.**
Rejected. Cleanest in theory — every create becomes independently replayable — but it
requires the API to accept client-supplied IDs across five resources. That is a bigger
ask than idempotency keys and changes the server's key strategy permanently.

**C. Local replica database with a sync engine (RxDB / PowerSync / ElectricSQL).**
Rejected for v1 scope, and named as the correct endgame *if* offline editing is ever
required. It solves conflicts properly, but it needs a sync protocol the API does not
have, and the create-only restriction (see non-goals) makes it heavy for what is
actually needed.

**D. "Save draft locally, submit manually later."**
Rejected as the primary design — it is the outbox with the automation removed, and it
puts the burden of remembering on the person least able to carry it. Retained as a
*component*: the queue view's manual retry is exactly this, for the dead-letter case.

**E. Do nothing; keep using paper and transcribe later.**
The status quo baseline. It loses data, delays entry by days, and introduces
transcription errors — but it is honestly cheaper than everything above, and it is the
right answer if the API cannot supply idempotency (D2). Say so plainly rather than
shipping a queue that silently duplicates observations.

## Consequences

### Positive

- Field work stops depending on signal; data is captured once, at the well, in the app.
- Resumable chains (D3) fix a real existing online defect — partial submissions that
  currently strand orphaned records with no recovery path.
- Deferring asset upload to submit (D4) fixes another: today, abandoning the inventory
  form leaves uploaded files in storage with no record referencing them.
- `captured_at` gives QA a provenance signal it does not have today.

### Negative / costs

- **Hard external dependency.** Without server-side idempotency this design can
  duplicate scientific observations. That is worse than the paper status quo, and it is
  a reason to delay, not to ship with a mitigation.
- Refactoring two working service functions into resumable step machines is invasive and
  carries regression risk on the online path, which is the path everyone uses today.
- Partial server state is still reachable: a permanent 422 halfway through an inventory
  chain leaves a well with some of its children. The API likely needs an "incomplete
  submission" state or an admin cleanup tool; the client cannot unwind it, because
  `deleteOne` is not implemented.
- Unsent field data now lives on a device, extending ADR 0003's at-rest exposure to
  landowner contacts and site photos — and the logout guard (D8) means the app will
  sometimes refuse to do what a user asks.
- The offline-pinning prerequisite (D5) is a workflow burden: a technician who forgets
  to pin a route cannot record levels for it, and will discover that at the well.
- Test surface grows sharply: every chain step gains a failure mode, and duplicate
  detection is only observable across a reconnect.

## Validation

- **Unit (Vitest):** outbox state machine (each status transition, backoff schedule,
  attempt cap); retry classification by HTTP status; resume-from-`progress` for both
  chains; schema migration of a queued payload; blob round-trip.
- **E2E (Cypress):** submit a GWL reading offline via CDP
  `Network.emulateNetworkConditions` → assert the queued-not-sent UI → reconnect →
  assert exactly one sample and one observation exist. Repeat with the response to
  step 1 dropped after commit, and assert idempotency prevents a second sample.
- **E2E:** kill the drain mid-inventory-chain, reconnect, assert one well — not two —
  and that screens/contacts complete.
- **Manual field test:** a full airplane-mode inventory with photos on a real iPad,
  then reconnect on Wi-Fi. Do this before any general rollout; the iOS storage and
  lifecycle behavior is the part least likely to be caught in CI.
- **Telemetry:** PostHog events on queue, drain success, drain failure by class,
  dead-letter, and discard — the dead-letter rate is the metric that says whether this
  is trustworthy.

## Open Questions

1. Which idempotency mechanism will the API support — a header, a `client_submission_id`
   column, or natural-key deduplication? This gates Phase 1.
2. Does the API want a first-class "incomplete submission" state, or is a partial chain
   an admin cleanup problem?
3. Maximum queue age before a submission is considered suspect — a two-week-old
   depth-to-water reading is still valid data, but is it still *expected* data?
4. Who reviews dead-lettered submissions — the technician who captured it, or a data
   steward?
5. Should offline GWL capture be allowed against a well the device has not cached, by
   entering an identifier manually? It removes the D5 workflow trap but permits typos
   into a `thing_id` that may not exist.
