# Geothermal Well Inventory — Feature Spec

**Status:** Draft / for review
**Ticket:** BDMS-878 (geothermal grid) — inventory sub-feature
**Author:** (draft)

---

## 1. Goal

Let an authorized user **inventory new geothermal wells** — create many well
records at once — through one of two entry paths that feed the same editable
grid:

1. **Load a CSV** — upload a spreadsheet export; rows populate the grid.
2. **Enter directly** — type/paste into a blank Glide Data Grid, spreadsheet-style.

Both paths converge on one reviewable grid; the user edits/corrects, then a
single **Save** creates the wells via the geothermal API. No per-cell autosave.

This is distinct from the existing **records** grid (edit records under an
existing well). Inventory is about *creating wells*.

---

## 2. Entity — geothermal well (real API contract)

Source: `GET /thing/geothermal-well` (verified live). Fields are snake_case.

| Field | Type | Notes |
|-------|------|-------|
| `well_data_id` | string (UUID) | **Server-assigned** on create — not entered |
| `thing_id` | number \| null | Currently null; not entered |
| `api` | string | API well number, e.g. `30-104-33218` |
| `name` | string | e.g. `GEOTHERMAL-0001` |
| `well_number` | string | e.g. `4` |
| `well_class` | string | e.g. `Oil & Gas` |
| `well_type` | string | e.g. `Wildcat`, `Production`, `Exploration` |
| `status` | string | e.g. `Abandoned`, `Active` |
| `operator` | string | |
| `owner` | string | |
| `total_depth` | number | feet |
| `completion_date` | string (ISO datetime) | |
| `has_geothermal_data` | boolean | |
| `county` | string | |
| `state` | string | default `NM` |
| `latitude` | number | |
| `longitude` | number | |

Create payload = these fields minus `well_data_id`/`thing_id` (server-owned).

---

## 3. User flows

### 3a. CSV load
1. User clicks **Upload CSV** (or drags a file).
2. Client parses the CSV (headers → well fields).
3. Parsed rows load into the grid as new (unsaved) rows.
4. Unmapped/blank cells are empty; parse errors are surfaced per row.
5. User reviews/edits in the grid, then **Save**.

- **Template:** a **Download template** button emits a CSV with the canonical
  header row (the field names in §2) so users start from the right shape.
- **Column mapping:** v1 matches CSV headers to field names **exactly**
  (case-insensitive, trimmed). Unknown headers are ignored (reported). A
  mapping UI (drag headers → fields) is a later enhancement.

### 3b. Direct grid entry
1. User clicks **Add rows** → N blank rows appended.
2. User types or pastes (Glide handles paste-from-Excel across a range).
3. User **Save**.

Both paths share the same grid, dirty tracking, and save.

---

## 4. Grid

Reuse **`EditableDataGrid<IWell>`** (`src/components/grid`) — the entity-agnostic
component already extracted in Phase 1.

- Columns = the editable fields in §2 (all editable; `well_data_id` shown
  read-only, blank until saved).
- Cell kinds: text for strings, number for `total_depth`/`latitude`/`longitude`,
  a boolean/checkbox for `has_geothermal_data`, date for `completion_date`, and
  **dropdown (single-select)** for the enum fields `well_type`, `well_class`,
  `status`. (Number/text exist today; **boolean, date, and dropdown cell kinds
  are new** — additions to `EditableDataGrid`.)
- Dropdown values: fixed allowed-value lists per enum field (source TBD — hard-
  coded constants vs lexicon-backed). CSV/paste values outside the list are
  flagged as invalid cells.
- Keyboard nav + range paste come free from Glide.

---

## 5. Save — batch create

Reuse the batch-save pattern already built in `records-grid.tsx`
(`computePendingOps` + `Promise.allSettled`), specialized to create-only:

- Every non-blank row → `POST /thing/geothermal-well` via the geothermal
  provider `create`.
- Per-row tracking: created rows adopt the server response (real
  `well_data_id`) and clear dirty; failed rows stay for retry with rejected
  cells tinted from Pydantic `fieldErrors` (provider already maps 422/409).
- Toolbar shows `n created, m failed`.
- No server bulk endpoint assumed → one request per row.

---

## 6. Validation

- **Client (pre-save):** required fields must be non-empty; numeric/date/bool
  fields must parse. Invalid cells are tinted and block that row's save.
- **Server:** 422/409 `fieldErrors` surface inline (existing mapping).
- **Proposed required fields:** `name`, `api`, `well_type`, `county`, `state`,
  `latitude`, `longitude`. **TBD** — the API's create schema isn't in the
  OpenAPI (stripped), so the real required set must be confirmed against the
  backend.

---

## 7. Access control

Admin-gated via `canEnterGeothermalData(canManageGeothermal)` — the same helper
as the records grid (bypassed in local dev, enforced in prod).

---

## 8. Navigation & route

- Route: `/geothermal/wells/inventory`.
- Nav: a **Geothermal Inventory** entry (Sandbox section for now, consistent
  with the current geothermal placement; promote to a real geothermal nav
  group when the feature graduates).

---

## 9. Reuse vs new work

**Reuse (exists):**
- `EditableDataGrid` + theme/sizing hooks (Phase 1).
- Geothermal provider `create` + Pydantic `fieldErrors` mapping (Phase 3).
- `computePendingOps` / batch-save + dirty tracking + inline cell errors.
- `IWell` real field interface.

**New:**
- CSV parse + template download via **`papaparse`** (new dependency — decided).
- Boolean, date, and **dropdown** cell kinds in `EditableDataGrid`, plus
  allowed-value lists for the enum fields.
- Inventory page (grid + toolbar: Add rows, Upload CSV, Download template, Save).
- Route + nav entry (Sandbox).
- Create-only save wrapper (adapt records-grid save to POST-only).

---

## 10. Decisions

- **CSV parser:** `papaparse` (new dependency). ✔
- **Duplicate handling:** treat every row as create; let the server 409 and
  surface the conflict inline. No client-side dedupe/upsert in v1. ✔
- **Enum fields** (`well_type`, `well_class`, `status`): **dropdowns** from
  fixed allowed-value lists (new select cell kind). ✔
- **Nav placement:** Sandbox (temporary). ✔
- **Records vs inventory:** inventory is create-wells only; the existing records
  grid is untouched. ✔

### Still open
1. **Required fields** — the real create-required set (§6) isn't in the OpenAPI
   (stripped); confirm against the backend before finalizing client validation.
2. **Dropdown value source** — hard-coded constants vs lexicon-backed lists for
   the enum fields, and the allowed values themselves.

---

## 11. Phased plan

- **P1 — Inventory page + direct entry:** new route/page, `EditableDataGrid`
  over blank rows, Add rows, admin gate. (No CSV yet.)
- **P2 — Batch create save:** POST-only save wrapper, per-row status, inline
  field errors.
- **P3 — CSV load:** parser + Upload + Download template + parse-error surfacing.
- **P4 — Cell kinds + polish:** boolean/date editors, required-field validation,
  duplicate handling, dropdowns for enum fields.
