# Public Page Content Audit

## Summary

Define what unauthenticated users should see on Ocotillo before public-page design begins.

The public page should explain what Ocotillo is, how to access it, and who it is for without exposing internal data, workflows, or infrastructure.

## Recommended Public Content

The public page should include:

- A brief description of Ocotillo and NMBGMR.
- A sign-in button.
- Instructions for requesting access.
- A support contact method.
- A note that access is restricted to authorized users.

Avoid assuming visitors already understand "Ocotillo" or internal acronyms.

## Security

Public pages should not expose:

- API endpoints, infrastructure, environments, or bucket names
- Authentication or authorization implementation details
- Internal documentation, admin tools, dashboards, or logs
- Unpublished datasets, record identifiers, or data schemas
- Internal workflows
- Staff-only (nonpublic) contact information

Public content should generally be limited to application information, authentication, support, and explicitly approved public services.

## Public Routes

Recommended public routes:

- `/login` .
- `/callback` — Required for the authentication redirect flow
- `/about`
- `/analytics-disclosure`
- `/report-a-bug`
- `/ogcapi` — How to connect to ArcGIS manual

Basically, the existing markdown files in `public/content/` for `about`, `analytics-disclosure`, `ogcapi`, and `report-a-bug` are good candidates for these public informational pages.

## Protected Routes

Keep application and data-management functionality authenticated, including:

- `/home` in its current form.
- `/ocotillo/*`
- `/geothermal/*`
- `/st2/*`
- `/geochronology/*`
- `/example/*`
- Create, edit, import, correction, export, inventory, record-detail, and form routes.

Error pages **should** be accessible without authentication but should **not** expose protected navigation or debugging information.
