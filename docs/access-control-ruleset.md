# Access Control Ruleset

## Roles

### AMP
- `AMP.Viewer`
- `AMP.Editor`
- `AMP.Admin`

### Geothermal
- `Geothermal.Viewer`
- `Geothermal.Editor`
- `Geothermal.Admin`

## Legacy Role Mapping

The application currently supports temporary compatibility mapping from older group names to the new role model.

- `Viewer` -> `AMP.Viewer`
- `Editor` -> `AMP.Editor`
- `Admin` -> `AMP.Admin`
- `AMPViewer` -> `AMP.Viewer`
- `AMPEditor` -> `AMP.Editor`
- `OcotilloAdmin` -> `AMP.Admin`

This mapping is temporary and should be removed before the v1 release once all users and groups have been migrated.

## Role Hierarchy

### AMP
- `AMP.Admin` implies `AMP.Editor` and `AMP.Viewer`
- `AMP.Editor` implies `AMP.Viewer`

### Geothermal
- `Geothermal.Admin` implies `Geothermal.Editor` and `Geothermal.Viewer`
- `Geothermal.Editor` implies `Geothermal.Viewer`

## Access Rules

### AMP.Viewer or Greater
- Can view Ocotillo read surfaces
- Can view `Map`
- Can view `Lexicon / Glossary`
- Can view `Contacts & Owners`
- Can view confidential data

### AMP.Admin Only
- Can access unfinished / WIP AMP resources

### Geothermal Roles
- `Geothermal.Viewer` or greater can view `geothermal` and `geothermal.*` read surfaces
- `Geothermal.Editor` can edit geothermal resources
- `Geothermal.Admin` can create, delete, manage geothermal resources

### Cross-Domain Admin Rule
- `water.locations` is restricted to `AMP.Admin` or `Geothermal.Admin`

### Lexicon
- All authenticated users can view the Lexicon
- No users can create, edit, or delete Lexicon content

## Resource Rules

### Ocotillo
- `ocotillo` -> readable
- `ocotillo.map` -> AMP view access required
- `ocotillo.lexicon` -> readable
- `ocotillo.contact` -> AMP view access required
- `ocotillo.thing-well` -> AMP view access required
- `ocotillo.thing-spring` -> AMP view access required
- `ocotillo.thing-well-pdf-preview` -> AMP view access required
- `ocotillo.thing-well-batch-export` -> AMP view access required
- `ocotillo.groundwater-level-observation` -> AMP view access required

### AMP / Water
- `water.*` -> AMP access required
- WIP `water.*` resources -> `AMP.Admin` only
- `water.locations` -> `AMP.Admin` or `Geothermal.Admin`

### Geothermal
- `geothermal` -> geothermal view access required
- `geothermal.*` read actions -> geothermal view access required
- `geothermal.*` edit -> geothermal editor access required
- `geothermal.*` create/delete/manage -> geothermal admin access required

## Confidential Data

- Confidential-contact filtering logic exists in the frontend
- Current rule: `AMP.Viewer` or greater can view confidential data
- Geothermal roles alone do not grant general AMP/Ocotillo access
- `water.locations` is the current exception and is visible to `Geothermal.Admin`

## Source of Truth

The implemented rules are defined in:

- [/Users/jross/Programming/DIG/NMBGMRDataManager/src/utils/accessControl.ts](/Users/jross/Programming/DIG/NMBGMRDataManager/src/utils/accessControl.ts)
