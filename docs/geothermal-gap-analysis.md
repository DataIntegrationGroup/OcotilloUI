# Geothermal — Gap Analysis vs the Legacy System

**Status:** Findings / for review with the data owner + backend
**Ticket:** BDMS-878
**Source:** Screenshots of the legacy Access DB **NM_Wells Geothermal (SQL2019)**
(`NM_Wells_FE_GeoThermal_ver03`) + a sample temperature-depth export
(`Borderplex_2026_03_31Td.csv`), provided by the geothermal data owner.

The legacy Access app is the **authoritative data model** the new Ocotillo
geothermal UI/API is meant to replace. This doc maps what it holds against what
we've built so far (inventory grid + records grid) and lists the gaps.

> Note: screenshot 3 shows a VBA "must be updated for use on 64-bit systems"
> compile error — the Access front end is breaking on 64-bit Office. That's
> context for *why* they're migrating off Access, not a data-model gap.

---

## Current Ocotillo model (what we have)

- **Well** (`IWell`, inventory grid): `well_data_id`, `api`, `name`,
  `well_number`, `well_class`, `well_type`, `status`, `operator`, `owner`,
  `total_depth`, `completion_date`, `has_geothermal_data`, `county`, `state`,
  `latitude`, `longitude`.
- **Record** (`IWellRecord`, records grid): `OBJECTID`, `WellDataID`,
  `WellName`, `WellNumber`, `API_suffix`, `ActionDate`, `EntryDate`,
  `EnteredBy`, `RecrdSetID`, `SourceID`, `Comments`.

This covers the **well identity / header** layer at a basic level. The gaps
below are what's missing.

---

## Gaps (priority-ordered)

### 🔴 G1 — The core geothermal measurements are not modeled

The whole purpose of the system is thermal data:
**temperature-depth logs → thermal gradient → heat flow**. The legacy DB has
dedicated subforms for exactly this (visible in the Forms list):
`GTTempDepth_Subform_new`, `GT_HeatFlowDataSbfrm`, `GTSumHeatFlow_Subform`,
`GT_Heatflow_sbfrm`.

The sample CSV is one such log:

| Column | Meaning |
|--------|---------|
| `Depth_m`, `Depth_ft` | measurement depth (both units) |
| `Resistance` | probe resistance |
| `Temp_F`, `Temp_C` | temperature (both units) |
| `Gradient_C_km` | thermal gradient (°C/km) |
| free-text notes | formation ("Camp Rice Formation"), "fine slots in screen" |

Our `IWellRecord` (WellName / Comments / dates) has **no fields for
depth/temperature/gradient/resistance/heat-flow**. The CSV import we built
ingests *well* rows, not temp-depth logs — so **this file has nowhere to land**.

**Needed:** a measurement model (temp-depth points + derived gradient / thermal
conductivity / heat-flow summary), plus a log importer that matches this CSV
shape. Backend endpoint required.

### 🔴 G2 — Location is drastically oversimplified

We store a single `latitude`/`longitude`. The legacy Well_Location record has:

- **Two datums**: `Lat_dd27`/`Long_dd27` (NAD27) **and** `Lat_dd83`/`Long_dd83`
  (NAD83), plus DMS (D/M/S), with `SourceUnits` + `SourceDatum`.
- **PLSS**: `UnitLetter`, `Sectn`, `Township` + `NorS_TDir`, `Range` +
  `EorW_RDir`, `SectnPart`, `Footage_NS`/`Footage_EW` + `NorS_FDir`/`EorW_FDir`,
  `UTM_zone`.
- **Basin** (e.g. San Juan) — missing entirely.
- **Location accuracy**: `LocAccType`, `LocAccMeas`, `LocAccVal`.
- **Multiple locations per well** ("Add New Location") with `Duplicated` /
  `Exclude` flags and a per-location `SourceID` (provenance).

Our county/state server-derivation plan is compatible, but the datum + PLSS +
accuracy + multi-location provenance model is absent.

### 🟠 G3 — Well header is missing many fields

| Legacy field | Ours |
|--------------|------|
| `Well_TVD` (true vertical depth) | only `total_depth` (measured) |
| `SpudDate`, `ComplDate`, `PlugDate`, `PlugBack` | only `completion_date` |
| `Fm_TD`, `Age_TD` (formation / age at TD) | — |
| `WellOrient` (vertical/deviated) | — |
| `CurOperatr`, `CurStatus`, `CurWellNam`, `CurWellNum`, `CurOwner` | flat operator/status/name/owner (no current-vs-historical split) |
| `PrdPoolCount` (producing pool count) | — |
| `Import_ID`, `Import_DB`, GUID | — (import provenance) |
| Data-existence flags: `ScoutTickt`, `DwnHoleSur`, `GeoLog`, `Geophyslog`, **`GthrmExist`**, `PetroData`, `CoreExists`, `Cuttings`, `SampleDat` | only `has_geothermal_data` (= `GthrmExist`) |

`has_geothermal_data` is **one flag in a family of ~9** yes/no data-presence
flags.

### 🟠 G4 — API is structured, not free text

Legacy: `API = 30-039-05212` (state `30`=NM · county `039` · well `05212`),
`Well_ID = 3003905212` (concatenated), plus a separate `API_suffix`. Ours is a
plain string with no structure or validation. Worth a parsed/validated API.

### 🟡 G5 — Missing supporting entities

- **Sources** — `SourceID` is a foreign key to a bibliography record
  (e.g. "Engler, Brister, Chen, Teufel, 2001"), not free text.
- **Records provenance/content** — `RecrdSetID`, `RecrdClass`, `EnteredBy`,
  `EntryDate`, Sample Sets, and **Lithology** (color / grain size / texture),
  `LithStrat`, `LithLog`.
- **Perf intervals**, **Production** (legacy `PerfIntrval_sbfrm`, `Prdctn_sc`).
- **Audit trails** — "Audits: Well Header / Locations / LithStrat / LithLog".

---

## Summary

Our inventory + records grids model the **well identity/header** layer at a
basic level. The three biggest gaps:

1. **Geothermal measurements (temp-depth, gradient, heat flow) are unmodeled** —
   the reason the system exists. The provided CSV can't be imported anywhere.
2. **Location** is ~10× simpler than the source (datums, PLSS, accuracy,
   multi-location provenance).
3. **Records** is a stub vs the real provenance / lithology / sample-set model.

## Recommended sequencing (proposal)

1. Confirm scope with the data owner: is Ocotillo replacing the *full* NM_Wells
   Geothermal DB, or just the well-inventory + thermal-log capture?
2. Backend: define the **temperature-depth / heat-flow** entities + endpoints
   (blocks G1) and the **richer location** entity (G2).
3. Frontend: extend the well header (G3), add a **temp-depth log importer**
   matching the CSV shape, and the location detail model (G2).
4. Later: Sources, Sample Sets, Lithology, Perf/Production, Audits (G5).

Nothing here is implemented yet — this is a findings doc to align on scope
before building.
