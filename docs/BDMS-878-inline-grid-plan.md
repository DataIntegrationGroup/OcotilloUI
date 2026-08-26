# BDMS-878 — Inline Spreadsheet Grid for Geothermal Data Upload

**Status:** Proposed approach / WIP
**Scope (corrected):** A spreadsheet-like grid to review, correct, and enter **Geothermal** data directly into Ocotillo — no separate upload step, keyboard navigation per spreadsheet conventions.

---

## 1. Goal

Give a data manager an inline Glide DataGrid to edit existing geothermal records and enter new ones, writing straight through to the geothermal API. Replace the current round-trip through external spreadsheets + Python scripts.

Acceptance criteria mapped to work:

| AC | Delivered by |
|----|--------------|
| Edit data inline from a grid, spreadsheet-like | Phase 2 (editable Glide grid on real data) |
| Changes saved directly to Ocotillo, no separate upload step | Phase 3 (write-back to provider `create`/`update`) |
| Keyboard navigation per spreadsheet conventions | Glide built-in (arrows, tab, enter, copy/paste) — verified Phase 2 |

---

## 2. Current state (recon findings)

**Assets that exist:**
- `@glideapps/glide-data-grid@^6.0.3` already a dependency.
- Working Glide patterns in the temporary demo `src/pages/example/DataGridPage.tsx` — cell kinds, `onCellEdited`, light/dark theme hook (`useGdgTheme` off `ColorModeContext`), ResizeObserver sizing, a bulk-add modal. **But** all write-back / CSV / submit in the demo are stubs (local state only).
- Geothermal data provider `src/providers/geothermal-data-provider.ts` already has `getList`, `getMany`, `getOne`, `create` (POST `{resource}`), `update` (PATCH `{resource}/{id}`). Registered as `geothermal` in `src/AppProviders.tsx:82`.
- Geothermal resources/pages scaffolded: `wells` list/show (`src/pages/geothermal/wells/`), well records shown via nested endpoint `wells/{id}/records`.

**Gaps that block anything from rendering (fix first):**
1. `geothermalResources` is **not** registered in the resources barrel `src/resources/index.tsx` (only ocotillo is spread in).
2. `GeothermalRoutes` (`src/routes/geothermal.tsx`) is **never mounted** in `src/App.tsx` — geothermal UI is currently unreachable.
3. No `create`/grid route registered for geothermal.

**Data-model gaps:**
- `src/interfaces/geothermal/IWell.ts` has only `OBJECTID`, yet pages already read `WellDataID`, `County`. Interface under-specifies the real API shape.
- `IWellRecord.ts` = 11 `string` fields (`API_suffix`, `ActionDate`, `Comments`, `EnteredBy`, `EntryDate`, `OBJECTID`, `RecrdSetID`, `SourceID`, `WellDataID`, `WellName`, `WellNumber`). No OpenAPI codegen for geothermal — columns must be authored by hand from the true API contract.

**Provider gaps vs Ocotillo:**
- Geothermal provider uses bare `fetch` with **no auth** (no Bearer token). Ocotillo injects a token + refresh. → confirm whether the geothermal write API requires auth.
- Geothermal `getList` returns a bare array (`total = data.length`), not an `{items,total}` envelope — fine for a grid, but no server-side paging/total.
- No Pydantic 422/409 → refine `fieldErrors` mapping (Ocotillo has one at `ocotillo-data-provider.ts:190-224`, copyable) — needed for inline cell validation feedback.

**Access control:**
- `canEditGeothermal` = Editor|Admin; `canManageGeothermal` = Admin only.
- Discrepancy: `canAccessResource` policy requires **Admin** for `create`, **Editor** for `edit`. So a grid that *creates* new rows is admin-only under current policy, editing existing rows is editor-ok. Must resolve before gating the "enter new records" path.

---

## 3. Decisions

1. **Auth — YES.** The geothermal write API requires a token. The geothermal provider must get the same Bearer-token + refresh interceptor as Ocotillo before any save works. This is a prerequisite for Phase 3.
2. **Role — ADMIN.** Both editing and entering rows in the grid gate on `Geothermal.Admin` (`canManageGeothermal`). No editor-level access to the grid. Resolves the earlier helper-vs-policy discrepancy in favor of admin-only.
3. **Save — EXPLICIT BATCH.** No per-cell autosave. Edits accumulate in grid state; a "Save changes" action flushes all dirty rows. No server bulk endpoint → client-side loop over single-record `create`/`update` with per-row success/error tracking.

### Still open (deferred, not blocking scaffolding)
- **Target entity** — `wells` vs nested **well records** (`wells/{id}/records`). Deferred; decide before Phase 2 column authoring.
- **API contract** — true field list/types/validation. Deferred; needed before Phase 2.

---

## 4. Proposed approach — phased

### Phase 0 — Wiring & auth (unblock)
- Register `geothermalResources` in `src/resources/index.tsx`; mount `GeothermalRoutes` in `src/App.tsx`; add a grid route (e.g. `/geothermal/wells/grid` or a `create`/`bulk` route).
- **Add Bearer-token + refresh interceptor to the geothermal provider** (auth = YES). Convert it to the Ocotillo axios pattern, or inject `getAccessToken()` into the existing `fetcher` headers + wire `axios-auth-refresh`-equivalent. Prerequisite for all saves.
- Contract/target entity deferred — correct `IWell`/`IWellRecord` interfaces once decided (before Phase 2).

### Phase 1 — Extract a reusable grid component
- Lift the Glide patterns out of the throwaway `DataGridPage.tsx` into a reusable, entity-agnostic `EditableDataGrid` under `src/components/` (or `src/components/grid/`): theme hook, ResizeObserver sizing, cell-kind dispatch, `onCellEdited`, column-def model.
- Keep it typed/generic over a row shape + a column spec (id, title, editable, cell kind, validator).
- The temporary demo stays as reference until this lands, then delete it.

### Phase 2 — Read + inline edit existing geothermal records
- New page (e.g. `src/pages/geothermal/wells/grid.tsx`) using `EditableDataGrid` fed by `useList`/`useDataGrid` with `dataProviderName: 'geothermal'` on the target resource.
- Editable columns per the real schema; read-only for keys/IDs. Verify keyboard nav (arrows/tab/enter, copy/paste) — Glide gives this for free.
- Gate render + edit on **`canManageGeothermal` (Admin)** via `<CanAccess>` / capability check.
- `onCellEdited` writes to local grid state + marks the row dirty. **No API call here** (batch save, not autosave).

### Phase 3 — Explicit batch save (no upload step)
- Track dirty rows in grid state. A **"Save changes"** action flushes them: client-side loop over provider `update` (PATCH) for existing rows, `create` (POST) for new rows. No server bulk endpoint exists.
- Per-row success/error tracking; optimistic UI with rollback on failed rows; keep dirty state for rows that failed so the user can retry. Show a summary (n saved / m failed).
- Add Pydantic 422/409 → `fieldErrors` mapping to the geothermal provider (copy Ocotillo pattern `ocotillo-data-provider.ts:190-224`) so failed cells surface inline.

### Phase 4 — Enter new records (bulk-add)
- Adapt the demo's `BulkAddModal` (blank N-row grid, grouped columns, paste-from-Excel) to the geothermal entity. New rows join the dirty set and flush through the same Phase 3 batch save (`create`).
- Gate on **`canManageGeothermal` (Admin)**.
- Real paste-from-Excel/CSV: Glide's built-in copy/paste covers cell-range paste; a CSV import button would need a parser (no `papaparse`/`xlsx` in deps yet) — treat as stretch.

---

## 5. Risks / notes
- Demo `DataGridPage.tsx` advertises CSV upload / "Open in Google Sheets" / "Create Wells" — all **non-functional placeholders**. Do not assume they work.
- No server-side bulk endpoint → large uploads become N single requests; consider a real batch endpoint on the API side if volume is high.
- Geothermal provider currently unauthenticated — a write path without auth is a security gap; confirm before shipping any save.

---

## 6. First concrete deliverable (suggested MVP)
Phase 0 (wiring + geothermal auth interceptor) → Phase 1 (extract reusable `EditableDataGrid`) → Phase 2 (read/inline-edit existing rows, admin-gated) → Phase 3 (explicit batch save). Target entity + true column schema get pinned before Phase 2 authoring.
