# Geothermal Well Search — API Contract (Proposal)

Status: **draft / proposal** — the parameter this describes is not implemented,
and at the time of writing no reachable backend serves the geothermal well
endpoint at all.

## Background

The geothermal Sandbox pages (Records Grid, Temp-Depth log) start with a well
picker. It used to be a single dropdown populated by one request:

```
GET thing/geothermal-well?page=1&size=500
```

Two problems, both consequences of doing selection without search:

1. **Silent truncation.** The catalogue runs to thousands of wells. Everything
   past the 500th was absent from the dropdown with nothing to say so, and a
   well that existed but was not listed was indistinguishable from a well that
   did not exist.
2. **Scrolling as a workflow.** Even within those 500, the only way to reach a
   well was to scroll a flat list ordered by whatever the server returned.

The picker is now a search box. It sends the user's term to the server and
reports how much of the match set it is showing.

## Proposed parameter

```
GET thing/geothermal-well?q=<term>&page=1&size=50
```

`q` is a free-text term. When absent or empty the endpoint behaves exactly as
it does today — the first page of the unfiltered list — so a picker with an
empty box still shows something.

### Matching

The term should match, case-insensitively, as a substring against at least:

| Field | Why |
| --- | --- |
| `name` | The label the picker shows, and what a user knows the well by |
| `api` | State-county-well identifier; how wells are cross-referenced |
| `well_number` | Operator's own numbering |
| `operator` | "show me everything Chevron drilled" |
| `county` | Coarse geographic narrowing |

A term with several whitespace-separated words should require every word to
match somewhere (AND), not any of them — `jemez 1` should narrow the results
that `jemez` returns, not widen them.

### Response

Unchanged from the existing list shape. The client relies on the paginated
envelope, and specifically on `total`:

```jsonc
{
  "items": [ /* IWell */ ],
  "total": 1284,   // matches for this q, NOT the size of the whole catalogue
  "page": 1,
  "size": 50,
  "pages": 26
}
```

`total` must be the count of records matching `q`. The picker shows
"Showing 50 of 1284 wells matching your search" from it, and decides whether to
offer "Show more". If the server returns the unfiltered count instead, that
line misreports and the button appears when there is nothing more to fetch.

The provider also accepts a bare array response, but then `total` is just the
array length and the picker cannot report the match count. The envelope is
preferred.

## Client behaviour

- Term is debounced 300 ms, so typing a well name is one request rather than
  one per keystroke.
- Page size starts at 50 and grows by 50 via "Show more", capped at 500 loaded
  at once. On reaching the cap the picker says so and asks the user to narrow
  the search, rather than truncating quietly the way the old dropdown did.
- A new term resets the page size, so a narrow search does not inherit a broad
  one's over-fetch.
- The term travels as `meta.params` through `geothermalDataProvider.getList`,
  which passes any `meta.params` entry through as a query parameter and skips
  null/undefined/empty values.

## If `q` is not implemented

The parameter is ignored and the endpoint returns the unfiltered first page.
The picker still works — it lists wells and the user can page through them —
but typing narrows nothing, and the "Showing N of M" line reveals the problem
immediately rather than hiding it: the total will not move as the term changes.

That is a deliberate property. The previous design failed silently; this one
fails visibly.

## Open questions

1. **Ordering.** Unspecified today. Relevance ordering (exact `name` match
   first, then prefix, then substring) would make the first result usually the
   right one. Absent that, a stable `name` sort is better than arbitrary order.
2. **Fuzzy matching.** Substring only, for now. Whether typo tolerance is worth
   it depends on how users actually refer to these wells.
3. **Where the endpoint lives.** `thing/geothermal-well` is absent from the
   bundled OpenAPI spec, returns 404 on the dev API, and collides with
   `thing/{thing_id}` on the local Ocotillo backend.
   `VITE_NMBGMR_GEOTHERMAL_API_URL` is unset in every `.env` example and
   `settings.tsx` falls back to the Ocotillo URL, so as configured the
   geothermal provider currently points somewhere that cannot serve it. This
   needs resolving before any of the above can be verified end to end.
