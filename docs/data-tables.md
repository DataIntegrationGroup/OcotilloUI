# Data Tables in Ocotillo

This guide explains how the data tables work throughout Ocotillo -- what they can do, what their limitations are, and what would be needed to extend them. Written for product managers and non-technical stakeholders.

## Where data tables are used

Data tables currently appear on four pages:

| Page | What it shows |
|---|---|
| Wells | Water wells recorded in the database |
| Springs | Natural spring sites |
| Locations | Geographic reference points for monitoring sites |
| Contacts | People and organizations associated with monitoring sites |

## How data gets into the table

The table does not load all records at once. Instead, it loads **50 records per page** from the server. When you move to the next page, it fetches the next 50 from the API.

This matters because some features (like the "Filter this page" search box) can only act on the records currently loaded, not on the full dataset. The total number of records in the database is shown in the top-right corner above the table.

## What you can do in the table

### Filter this page (quick search)

The search box in the top-left of the table header searches across all columns of the **50 records currently loaded on the page**. It is instant and does not require a round-trip to the server.

Use this when you want to quickly find a specific well name or value within the current set of results.

Limitation: it does not search your entire database. If the record you are looking for is on a different page, it will not appear.

### Column filters (server-side filters)

The **Filters** button opens a panel where you set conditions that narrow results across the **entire** dataset. Each change sends a request to the server.

**Important:** The app uses **MUI X Data Grid (Community)**. In this edition, the filter panel only supports **one active column filter at a time**. If you add a filter on a second column, it **replaces** the previous one rather than stacking. The Ocotillo API and Refine can in principle accept **multiple** filter parameters in one request, but the current grid UI does not let you combine several column filters without upgrading to a commercial Data Grid tier or building a custom filter UI.

Currently supported filter operators (when the API implements them for that column):

- **contains** -- finds records where the field includes the search text
- **equals** -- finds records where the field exactly matches
- **starts with** -- finds records where the field begins with the search text
- **ends with** -- finds records where the field ends with the search text
- **is empty / is not empty** -- finds records with no value in that field

Other operators shown in the dropdown (such as "does not contain" or "does not equal") are displayed by the component but are not yet supported by the API. Applying them will likely return no results or an error. Supporting additional operators would require a backend change.

### Sorting

Clicking any column header sorts the table by that column when the column is sortable. Clicking again reverses the sort order. Sorting is applied server-side, so it sorts across all records, not just the current page.

For columns that aggregate multiple links (for example **Aquifers**, **Contacts** on wells, or **Associated Sites** on contacts), the server uses a fixed rule such as ordering by the alphabetically first linked value. That order may not match how labels are joined with commas in the cell.

Some columns stay non-sortable by design (for example **Primary Phone** and **Primary Email** on Contacts), usually because sorting would require extra API work or privacy rules.

### Column visibility

The **Columns** button lets you show or hide individual columns. This only affects your current browser session -- it resets when you reload the page.

### Density

The **Density** button adjusts row height between compact, standard, and comfortable. This is a personal preference setting and also resets on page reload.

### Clicking a row

On the Wells, Springs, and Locations pages, clicking any row navigates to the detail page for that record. On the Contacts page, clicking a row shows contact detail panels below the table (phone, email, address) rather than navigating away.

### Export

The **Export** button on each page downloads the current filtered dataset as a CSV file. The export pulls up to 1,000 records from the server, applying any active column filters.

## Filters reset on page reload

Filters, sort order, and pagination all reset when you reload or navigate away from the page. This is intentional -- the previous behavior stored filter state in the URL, which caused filters to reappear after a hard refresh and made the URL confusing.

If you need filters to persist across sessions (for example, a saved view of "all actively monitored wells"), that would be a separate feature to design and build.

## What would require backend work

The following improvements would require changes to the OcotilloAPI server in addition to the front-end:

- **Full-dataset search from the toolbar** -- a single search box that searches all records across all pages, not just the 50 loaded ones. This requires an API search endpoint that accepts a text query.
- **Additional filter operators** -- "does not contain," "does not equal," and "is any of" would need to be implemented in the API filter logic.
- **Additional columns** -- several useful fields (owner name, county, latitude/longitude, site name) exist in the database but are not currently returned by the API in the list endpoints. Adding them requires API and potentially database changes.
- **Saved views or presets** -- letting users save a filter configuration and return to it later would need storage on the server or in user preferences.
- **Multiple column filters visible at once in the filter panel** -- the Ocotillo API can accept more than one `filter` query parameter, but **MUI X Data Grid (Community)** only allows **one** active column filter in the built-in panel. Offering several simultaneous column filters in that panel would need a **custom filter UI** (or a different table stack), not only an API change.

## Column reference by page

### Wells

| Column | Description | Sortable |
|---|---|---|
| Name | Well identifier (e.g. WELL-0001) | Yes |
| Well Status | Current operational status | Yes |
| Monitoring | Whether the well is actively monitored | Yes |
| Aquifers | Aquifer systems the well is associated with | Yes (first aquifer name alphabetically) |
| Release Status | Whether the record is public | Yes |
| Well Depth (ft) | Total depth of the well casing | Yes |
| Hole Depth (ft) | Total drilled depth | Yes |
| Created At | When the record was added to the system | Yes |

### Springs

| Column | Description | Sortable |
|---|---|---|
| Name | Spring identifier | Yes |
| Release Status | Whether the record is public | Yes |
| Spring Type | Classification of the spring | Yes |
| Created At | When the record was added to the system | Yes |

### Locations

| Column | Description | Sortable |
|---|---|---|
| Name | Location identifier | Yes |
| Release Status | Whether the record is public | Yes |
| Coordinates (WKT) | Geographic coordinates in Well-Known Text format | Yes |
| Notes | Associated notes from the field | Yes |
| Created At | When the record was added to the system | Yes |

### Contacts

| Column | Description | Sortable |
|---|---|---|
| Name | Person or organization name | Yes |
| Organization | Affiliated organization | Yes |
| Role | Role or title | Yes |
| Contact Type | Classification of the contact | Yes |
| Primary Phone | First phone number on file | No |
| Primary Email | First email address on file | No |
| Associated Sites | Wells or springs linked to this contact | Yes (first site name alphabetically) |
| Created At | When the record was added to the system | Yes |
