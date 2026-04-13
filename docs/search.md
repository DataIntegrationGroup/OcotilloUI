# Search

Ocotillo's global search lets users find wells, springs, contacts, and assets across the dataset without navigating to individual list pages.

## How to Open Search

- Click the search bar in the top navigation
- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) from anywhere in the app

## How Search Works

Typing in the search modal sends a debounced request (400ms delay) to the API:

```
GET /search?q=<query>&page=1&size=100
```

Results are returned grouped by type: **Wells**, **Springs**, **Contacts**, and **Assets**. Duplicate records (same type and ID) are filtered out on the client before display.

The search is powered entirely by the API -- it is not a client-side filter of already-loaded data. Results depend on what the backend indexes.

## Recent Searches

When the modal opens with an empty query, it shows up to 8 recent searches. These are stored in the browser's `localStorage` under the key `ocotillo_search_history`.

- Recent searches persist across sessions in the same browser
- Clicking a recent search re-populates the input and triggers a new search
- "Clear history" removes all stored searches
- Each time you click a result, the current query is saved to history

Recent searches are per-browser and per-user only in the sense that each browser/device has its own localStorage. They are not synced to any server.

## Result Types

| Type | What it matches | Subtitle shows |
|---|---|---|
| Wells | Well name, alternate IDs | Type, depth, purposes |
| Springs | Spring name | Type |
| Contacts | Contact name, address, phone, email | First phone, first address |
| Assets | File path, related well names | Storage path, size, type |

Each result row shows a type icon, the record name (with matched text highlighted), and a subtitle with the most useful contextual fields.

Clicking any result navigates to that record's detail page and closes the modal.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Cmd+K` / `Ctrl+K` | Open search modal |
| `Escape` | Close modal and clear query |
| `Enter` on a recent search | Re-run that query |

## Known Limitations

- Search is limited to what the API indexes. Records not yet ingested will not appear.
- The quick filter on list pages ("Filter this page...") only filters the currently loaded page of results -- it is separate from global search.
- Results are capped at 100 per query. If a common term returns many matches, narrow the query.
- Search history is browser-local. Clearing browser data will erase it.

## Fields Requiring Backend Work (Future)

The following fields have been added to the `WellResult` TypeScript interface as optional placeholders, but the `/search` API endpoint does not yet return them. These require changes to OcotilloAPI's search query:

| Field | Description |
|---|---|
| `owner_name` | Name of the contact associated as owner of the well |
| `county` | County where the well is located |
| `site_name` | Location/site name distinct from the well identifier |
| `alternate_ids` | Legacy NMBGMR IDs (e.g. USGS site numbers, OSE pod IDs) |
| `owner_phone` | Phone number of the well's owner contact |

Once the API returns these fields, the search result subtitle line will display them automatically -- no frontend changes needed.

## How to Extend Search

To add a new result type (e.g. Field Events):

1. Add the new group to `src/constants.ts` (`GroupType` enum)
2. Add a new result type to `src/interfaces/ocotillo/SearchResult.ts`
3. Add it to the `SearchResult` union type
4. Add a `case` to `navigateToResult()` in `src/components/SearchModal.tsx`
5. Add an icon mapping in the `TypeIcon` component in `SearchModal.tsx`
6. Add a subtitle builder case in `buildSubtitle()` in `SearchModal.tsx`
7. Coordinate with the API team to include the new type in the `/search` response
