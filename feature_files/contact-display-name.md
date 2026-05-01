---
id: contact-display-name
title: Contact Display Name
status: partial
created: 2026-05-01
updated: 2026-05-01
related_files:
  - src/utils/contactDisplayName.ts
  - src/components/WellShow/Contacts.tsx
  - src/pages/ocotillo/contact/list.tsx
  - src/pages/ocotillo/contact/show.tsx
  - src/pages/ocotillo/thing/list.tsx
  - api/search.py   # OcotilloAPI repo
deferred_items:
  - id: org-contact-type
    title: "Mark contacts as org type"
    description: >
      Requires a new contact_type lexicon term ("Organization"), an Alembic
      migration, API filter support, and UI filtering/display changes in both
      repos. Would make org-only contacts filterable and visually distinct
      from person contacts.
    effort: medium
    priority: low
  - id: confidential-org-masking
    title: "Mask organization as well as name for confidential contacts"
    description: >
      sanitizeContact currently replaces name with "Confidential Contact" but
      leaves organization visible. For org-only contacts the org becomes the
      display name, which may expose sensitive information. sanitizeContact
      should be updated to also blank organization when release_status is
      private and the viewer lacks confidential access. As of 2026-05-01,
      2,052 of 2,126 contacts (96%) are private, so this gap affects nearly
      all contact records for viewers without elevated access.
    effort: low
    priority: medium
---

# Contact Display Name

## Problem

The `Contact` data model allows `name` to be null when `organization` is
present (the API enforces that at least one of the two fields is set). This
means org-only contacts have always had a blank display name everywhere in
the UI: the wells list contacts column, the well detail Contacts card, the
contacts list page, and contact search results.

## Resolution logic

A single utility function in `src/utils/contactDisplayName.ts` resolves the
display name for any contact object:

```
getContactDisplayName(contact):
  1. name (non-empty after trim)   → return name
  2. organization (non-empty)      → return organization
  3. neither                       → return "" (guarded by API validation)
```

For a list of contacts (for example the Contacts column on the wells list):

```
getContactsLabel(contacts[]):
  map each contact through getContactDisplayName,
  filter out blank results,
  join with ", "
```

## All edge cases

| Scenario | name | organization | Display value |
|---|---|---|---|
| Person only | "Matt Zwager" | null | "Matt Zwager" |
| Person + org | "Matt Zwager" | "NMBGMR" | "Matt Zwager" |
| Org only | null | "NPS" | "NPS" |
| Both null | null | null | "" (blocked by API) |
| Empty string name | "" | "NPS" | "NPS" (trim treats "" as null) |
| Confidential person | "Confidential Contact" | "NMBGMR" | "Confidential Contact" |
| Confidential org-only | "Confidential Contact" | "NPS" | "Confidential Contact" |

**Important:** `getContactDisplayName` must be called on the contact value
*after* `sanitizeContact` has run. `sanitizeContact` sets `name` to
`"Confidential Contact"` for private contacts when the viewer lacks
confidential access. Calling `getContactDisplayName` first and then
`sanitizeContact` would cause org-only private contacts to fall through
to their organization value and expose it.

## Current contact_type values

The `contact_type` lexicon category currently has three terms:

- **Primary** — the main contact for a well
- **Secondary** — an additional contact for a well
- **Field Event Participant** — a person who participated in a field event

None of these distinguish a person from an organization. This is tracked as a
deferred item (`org-contact-type`) for a future cycle.

## Why the utility function approach was chosen

The two data-level alternatives were considered and rejected:

- **Copy org name into the name field**: Would conflict with the
  `uq_contact_name_organization` unique constraint for rows where org already
  equals name. Also creates duplicated data that must stay in sync.
- **Mark contacts as org type**: Valid longer-term but requires schema changes,
  a migration, and API and UI filtering work in both repos.

The utility function fixes all four display surfaces immediately with no data
migration, no schema change, and one small API label fix.

## Where the logic is applied

| Surface | File | Change |
|---|---|---|
| Search results label | `api/search.py` (OcotilloAPI) | `c.name` → `c.name or c.organization` |
| Wells list Contacts column | `src/pages/ocotillo/thing/list.tsx` | `valueGetter` and `renderCell` use `getContactDisplayName` |
| Well detail Contacts card | `src/components/WellShow/Contacts.tsx` | name gates use `getContactDisplayName`; org line suppressed when display name equals org |
| Contacts list Name column | `src/pages/ocotillo/contact/list.tsx` | `valueGetter` uses `getContactDisplayName` |
| Contact show page title | `src/pages/ocotillo/contact/show.tsx` | title uses `getContactDisplayName` |
