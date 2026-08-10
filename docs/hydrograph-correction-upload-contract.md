# Hydrograph Correction — Upload API Contract (Proposal)

Status: **draft / proposal** — no upload endpoint exists in the Ocotillo API yet.
This document specifies the contract the Hydrograph Correction workbench will
use to publish corrected transducer measurements to the Ocotillo database.

## Background

The workbench (`/ocotillo/hydrograph-correction`) ingests a raw logger file
(Diver Office water head, Wellntel acoustic, wellpy workbook, or generic CSV),
converts water head to depth to water below ground surface (ft bgs) using
manual observations as sensor-depth anchors, and lets the user apply
corrections (offset/zero cleanup, shifts, snaps, drift correction). The output
is a corrected time series that today can only be downloaded as CSV.

The Ocotillo API already models stored transducer data as **observation
blocks**:

- `GET /observation/transducer-groundwater-level` returns
  `TransducerObservationWithBlockResponse` items — an `observation`
  (`value`, `observation_datetime`, `parameter_id`, `deployment_id`,
  `release_status`) paired with its `block`
  (`start_datetime`, `end_datetime`, `parameter_id`, `release_status`,
  `review_status`).
- There is no `POST` for transducer observations. The closest precedent is
  `POST /observation/groundwater-level/bulk-upload` (multipart file) and
  `POST /observation/groundwater-level` (single JSON observation).

A corrected upload is a batch with shared provenance and review lifecycle, so
the natural unit of upload is **one block per corrected file**.

## Proposed endpoint

```
POST /observation/transducer-groundwater-level/block
Content-Type: application/json
Authorization: Bearer <OAuth2 access token>   (same OAuth2AuthorizationCodeBearer as the rest of the API)
```

### Request body

```jsonc
{
  // Target well. Required.
  "thing_id": 1234,

  // Deployment the data came from. Optional: when omitted, the server
  // resolves the deployment for thing_id whose installation/removal dates
  // cover the block's time span; 422 if none or more than one matches.
  "deployment_id": 88,

  // Lexicon id for the observed parameter (depth to water bgs, ft).
  // Required — the client sends it explicitly rather than assuming a
  // server-side default, mirroring CreateGroundwaterLevelObservation.
  "parameter_id": 7,

  // Block lifecycle. Both optional with safe defaults.
  "release_status": "provisional",   // default "draft"; enum release_status
  "review_status": "not reviewed",   // default "not reviewed"; enum review_status

  // Provenance for auditability. source_file is required; the rest optional.
  "provenance": {
    "source_file": "SO-0167_20250115.csv",
    "source_kind": "water_head",        // "water_head" | "depth_to_water"
    // Free-form audit trail, in applied order. Snap entries name the manual
    // anchor's collector when the field event records one — the alignment is
    // only as good as the hand measurement it was pinned to — and say how the
    // anchor value was obtained: "interpolated at the measurement time" when
    // the manual falls inside the trace, "clamped to the nearest end of the
    // trace" when it does not and the line cannot pass through it.
    "corrections": [
      "convert_water_head (drift corrected)",
      "remove_offsets_zeros (threshold 0.25)",
      "shift (-1.25 ft, 2025-03-16T00:00:00Z to 2025-04-15T00:00:00Z)",
      "snap_to_manual (+0.42 ft to 2025-02-11T17:00:00Z, interpolated at the measurement time, collected by Joseph Beman (NMBGMR))"
    ],
    "notes": "Snapped to 2025-04-13 manual measurement."
  },

  // The corrected series. Values are depth to water below ground surface in
  // feet. Timestamps are ISO 8601; naive timestamps are rejected — the
  // client must send an explicit offset (the workbench sends UTC).
  //
  // `note` is an optional per-observation correction annotation, present
  // on every observation whose value was modified by a correction: shifts,
  // snaps, level-offset removal, and estimates (e.g. a spurious acoustic
  // reflection interpolated from its neighbors). Multiple corrections
  // accumulate as semicolon-separated clauses. The server should persist
  // it with the observation so downstream review can distinguish measured
  // from corrected/estimated values.
  //
  // Water-head conversion also emits one row the logger never recorded: an
  // "anchor knot" at each manual measurement's own timestamp, carrying the
  // manual's value, so the corrected series passes through the measurement
  // at the instant it was taken rather than near it. These rows are noted
  // as such and fall off the logger's sampling cadence by design.
  "measurements": [
    { "observation_datetime": "2025-01-15T00:00:00Z", "value": 42.51 },
    {
      "observation_datetime": "2025-01-15T06:00:00Z",
      "value": 42.55,
      "note": "spurious reflection removed; value interpolated from neighbors (was 84.53)"
    }
  ]
}
```

### Server-side semantics

- Exactly **one block** is created per request. `start_datetime` /
  `end_datetime` are derived server-side from the min/max measurement
  timestamps — the client does not send them.
- All measurements are created atomically with the block: either the whole
  request commits or nothing does.
- **Overlap policy**: if an existing block for the same `thing_id` +
  `parameter_id` overlaps the new block's time span, the request is rejected
  with `409 Conflict` listing the overlapping block ids. A
  `?replace_overlapping=true` query parameter deletes/supersedes the listed
  blocks in the same transaction (requires the same permission as block
  deletion). The UI always makes the first request without the flag and
  surfaces the conflict to the user before retrying.

### Validation rules (422 on violation)

| Rule | Detail |
|---|---|
| Non-empty | `measurements` must contain at least 1 row |
| Batch cap | ≤ 100,000 rows per request (one request per logger file is expected; a 90-day 6-hour file is 360 rows) |
| Timestamps | ISO 8601 with explicit offset; strictly increasing (no duplicates) |
| Values | finite numbers; ft bgs; server may enforce a plausibility range per well (e.g. non-negative, less than well depth when known) |
| Enums | `release_status`, `review_status` must be valid enum members |
| Error shape | standard `HTTPValidationError`, with row indices in `loc` (e.g. `["body","measurements",41,"value"]`) so the UI can highlight offending rows |

### Response — `201 Created`

Mirrors the existing read shape so the UI can merge it straight into the
`GET /observation/transducer-groundwater-level` result set:

```jsonc
{
  "block": {
    "id": 512,
    "created_at": "2026-07-28T17:04:11Z",
    "release_status": "provisional",
    "review_status": "not reviewed",
    "start_datetime": "2025-01-15T00:00:00Z",
    "end_datetime": "2025-04-14T18:00:00Z",
    "parameter_id": 7
  },
  "observation_count": 356,
  "thing_id": 1234,
  "deployment_id": 88
}
```

Individual observations are not echoed back (the client already has them);
`observation_count` confirms how many rows were written.

### Errors

| Status | Meaning |
|---|---|
| 401 | missing/expired token |
| 403 | authenticated but lacking write permission on the resource |
| 404 | `thing_id` or `deployment_id` not found |
| 409 | time-span overlap with existing block(s); body lists block ids |
| 422 | validation failure (see rules above) |

## UI integration plan

- The workbench gains a **Publish to Ocotillo** action (next to Download CSV)
  that maps `correctedMeasurements` to `measurements`, fills `provenance`
  from the session (file name, value kind, applied operations), and posts
  via `ocotilloDataProvider`.
- Publishing is disabled in demo mode and until a well is resolved
  (`thing_id` required).
- On 409, the UI shows the overlapping block spans and offers an explicit
  "Replace existing block(s)" confirmation before retrying with
  `replace_overlapping=true`.
- On success, the stored-transducer series is refetched so the new block
  appears on the chart and in the data table.

## Proposed endpoint — delete stored observations by time range

The workbench's **Delete Stored Data** pane removes stored transducer
observations for a well over an explicit time range (re-ingesting a span that
was published from a bad file, clearing readings recorded while the sensor was
out of the water, and so on). No delete endpoint exists yet.

```
DELETE /observation/transducer-groundwater-level?thing_id=1234&start_time=2025-03-01T00:00:00Z&end_time=2025-03-15T00:00:00Z
Authorization: Bearer <OAuth2 access token>
```

Query parameters mirror the existing `GET` on the same path, so the set the
client previews with `GET` is exactly the set `DELETE` removes.

| Parameter | Required | Detail |
|---|---|---|
| `thing_id` | yes | target well; deleting without it is rejected |
| `start_time` | yes | ISO 8601 with explicit offset; inclusive |
| `end_time` | yes | ISO 8601 with explicit offset; inclusive; must be after `start_time` |

### Server-side semantics

- Deletes every transducer observation for `thing_id` whose
  `observation_datetime` falls within `[start_time, end_time]`, in one
  transaction.
- Blocks are reconciled: a block fully covered by the range is deleted; a
  block partially covered keeps its surviving observations and has its
  `start_datetime` / `end_datetime` narrowed to them.
- Omitting `thing_id`, `start_time`, or `end_time` is a `422` — there is
  deliberately no "delete everything" form of the request.

### Response — `200 OK`

```jsonc
{
  "deleted_observation_count": 1204,
  "deleted_block_ids": [512],
  "updated_block_ids": [498],
  "thing_id": 1234
}
```

### Errors

| Status | Meaning |
|---|---|
| 401 | missing/expired token |
| 403 | authenticated but lacking delete permission |
| 404 | `thing_id` not found |
| 422 | missing bound, unparsable timestamp, or `end_time` <= `start_time` |

### UI safeguards

Deletion is irreversible, so the workbench gates it at several points:

- The pane only renders when a real Ocotillo well is bound (never in demo
  mode) **and** the signed-in user passes
  `can({ resource: 'ocotillo.hydrograph-correction', action: 'delete' })` —
  admin-only, one step above the editor access the rest of the page needs.
  The gate is a UX affordance, not a security control; the server must still
  enforce `403`.
- Both bounds must be entered explicitly. The brushed chart selection can be
  copied into them with a button, but brushing alone never arms a deletion —
  the brush scopes correction edits and reusing it here would let a stray drag
  set up a delete.
- An inverted range resolves to "no range" rather than being silently
  reordered, and reports the problem inline.
- The pending range is shaded on the chart over the stored series, so the
  span being confirmed is visible against the data.
- The pane counts the stored observations inside the range before anything is
  sent, and the delete button stays disabled while that count is zero.
- Confirmation is a modal that restates well, bounds, and the affected count
  as a fraction of all stored observations, warns separately when the range
  covers every stored observation, and requires the user to type the well
  name — a per-well phrase, so the confirmation cannot be muscle-memoried.
- The dialog cannot be dismissed while the request is in flight, and the
  stored series is refetched on success so the chart shows what remains.

## Supporting endpoints for Wellntel ingestion

The Wellntel ingest dialog (Ingest Wellntel on the Hydrograph Correction
page) needs two additional endpoints. The UI already calls both and falls
back to demo data when they are unavailable.

### 1. Sensor-type filter on the thing list

```
GET /thing?sensor_type=Acoustic%20Sounder
```

Returns only things that have a deployment whose sensor is of the given
`sensor_type` (existing `sensor_type` enum; Wellntel units are
`"Acoustic Sounder"`). Used to restrict the dialog's well picker to wells
with a Wellntel sensor installed. Today this linkage is only walkable in
the other direction (`GET /sensor?thing_id=...`), which would force an
N+1 scan over every well.

Alternative shape if filtering `/thing` is awkward server-side: a
dedicated `GET /deployment?sensor_type=...` list endpoint returning
`thing_id`s; the UI would then hydrate names with one thing query.

### 2. Wellntel readings proxy

```
GET /wellntel/readings?thing_id=1234&start_time=...&end_time=...
```

Server-side proxy for the Wellntel analytics API
(`https://connect.wellntel.com/analytics-api/readings`). Rationale:

- The Wellntel API key stays server-side. (wellpy currently stores the
  key in client preferences — this is the chance to fix that.)
- The server owns the wellname→PointID mapping (wellpy hardcodes
  `POINTID_MAP`; it should live in the database, e.g. on the deployment
  or a thing-id-link).
- The Wellntel API pages at 1000 readings per request with cursor-style
  `start` advancement; the proxy hides that pagination and returns the
  full range.

Response rows mirror wellpy's `.wcsv` export shape:

```jsonc
{
  "items": [
    { "timestamp": "2025-01-15T06:00:00Z", "depth": 42.01, "temperature_C": 18.2 }
  ],
  "total": 356,
  "page": 1,
  "size": 10000,
  "pages": 1
}
```

`depth` is already depth to water bgs in feet — no head conversion. The
dialog defaults the requested `start_time` to the timestamp of the latest
stored transducer observation for the well (queried via
`GET /observation/transducer-groundwater-level?thing_id=...` sorted
descending, size 1 — requires that endpoint to honor `sort`/`order`
parameters), so recurring ingests continue where the last one ended.

## Open questions

1. **Parameter id source** — hardcode the DTW-bgs lexicon id in UI config, or
   resolve it by name via the lexicon endpoint at runtime?
2. **Raw head retention** — should the request optionally carry the raw
   water-head series (second parameter block) so the uncorrected signal is
   preserved server-side, or is file/asset attachment the right home for it?
3. **Review workflow** — does publishing as `provisional` trigger any
   existing review queue, or does review tooling need to grow a view for
   transducer blocks?
4. **Wellntel cadence** — acoustic data may arrive via recurring API pulls
   rather than file uploads; same endpoint, or a separate ingest path with
   dedupe-by-timestamp instead of block overlap rejection?
5. **Wellntel identity mapping** — where should the wellname→PointID map
   live (deployment metadata, thing-id-link, or a wellntel-specific
   table), and who maintains it when new sensors are installed?
