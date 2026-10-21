---
generated-by: claude-opus-5
generated-on: 2026-09-14
prompted-by: jakeross
---

# Chemistry report — reviewer comment triage

Source: `annual-report-WL-1187-2026_MR_SDS.pdf`, 36 annotations from Monica
Rakovan (MR), Sianin Spaur (SS), and Stacy Timmons (ST), dated Aug 27 –
Sep 13, 2026.

The reviewed PDF is the **reference mockup**, not a render of the current
exporter. A third of the comments target features the mockup showed and the
implementation never had — nearby-well medians, percentile bars, PLSS, project
name, report IDs, collector names, free-text sampling notes. Those are recorded
below as **N/A (mockup only)** so they are not re-litigated, and as standing
constraints on anything added later.

Code under review: `src/components/pdf/chemistry/ChemistryReportPdf.tsx`,
`src/components/pdf/chemistry/styles.ts`, `src/utils/chemistryReport.ts`,
`src/constants/drinkingWaterStandards.ts`,
`src/pages/ocotillo/chemistry-report/export.tsx`.

## A. Actionable, small and unambiguous — **done**

| # | Reviewer | Comment | Change |
|---|---|---|---|
| A1 | MR | "Delete Annual" | Drop "Annual" from the title everywhere: masthead `reportTitle`, `OcotilloDocument` `title`/`subject`, the page footer render string, and the download filename in `downloadChemistryReport.tsx`. |
| A2 | MR | "Aquifer Mapping and Monitoring Program" | Masthead org line currently reads "Aquifer Mapping Program". Add "and Monitoring". |
| A3 | ST | "Say that this is NMBGMR Well Point ID" | `KvGrid` label `Point ID` → `NMBGMR Well Point ID`. |
| A4 | SS | "specify that the measurement is of the casing diameter" | `KvGrid` label `Casing` → `Casing diameter`. |
| A5 | SS | "just report elevation in ft or define amsl" | `Land surface elev.` value drops `amsl` for `ft above sea level`. |
| A6 | ST | "Wording suggestion: Above recommended range." | `Above taste/odour limit` stat label, the SMCL pill text, the legend entry, and the SMCL callout heading. Fold in the en-GB → en-US spelling while touching these (`odour` → `odor`, `litre` → `liter`, `colour` → `color` in the glossary). |
| A7 | ST ×2 | "No phone numbers… I would just do email not phone" | Removed `(575) 835-5327` from the fixed page footer and from the "Questions, or want more data?" glossary entry, and `(505) 476-8620` from the MCL callout. The Drinking Water Bureau is still named as somewhere to turn after an exceedance; only its number is gone. |
| A8 | MR (highlight) | "Ion balance — too technical for public" | Drop the `Ion balance` glossary entry. It is already conditional on the sampling-notes section, which is off by default. |

## B. Actionable, behavioural — **done**

| # | Reviewer | Comment | Change |
|---|---|---|---|
| B1 | ST ×2 | "there may be many features provided here that will be not populated. Will we just leave vacant?" / "if we don't have a comparison water level, just eliminate the box" | At-a-glance stats and `KvGrid` cells currently render `—` / `Needs two readings` when empty. Render only populated stats, and let the stat row reflow; keep `KvGrid` padding cells for grid alignment but drop a whole row when every entry in it is empty. |
| B2 | MR | "Is this [water level change] important to be in this box if this is for water quality at a glance?" | Decision, not a bug. Two coherent readings: drop the water-level-change stat from At a glance entirely (MR's reading), or keep it only when a comparison exists (ST's reading, = B1). **Recommend** B1 alone — ST's reply is the later and more specific of the two. |
| B3 | MR | "Can we add the water level change here?" | Water level section prints the readings but not the change between them. `waterLevelChangeFt` already computes it — print it in the `SectionHead` note, next to the reading count. It compares only depths from the same reference, so it is absent for mixed-reference wells; fall back to the count alone. |
| B4 | SS | "don't auto-populate any explanations/interpretations for the chemistry, it really needs to be researched case by case" | The exceedance callout prints `row.standard.note`, which is where "Arsenic occurs naturally in New Mexico groundwater" comes from. Remove the `note` render from both callouts and delete the four populated `note` fields (Arsenic, Fluoride, Nitrate, Lead) from `DRINKING_WATER_STANDARDS`. Keep the `note?` field on the type only if something non-interpretive still needs it; otherwise remove it. |
| B5 | SS | "rather than a 'standard' column and 'type' column… a 'Maximum contaminant level' column and a 'secondary maximum contaminant level' column" | Replace `Standard` + `Type` in `CHEM_COLUMNS` with two limit columns, each populated only for its own kind. Costs horizontal room at 8pt on Letter — likely needs `Unit` folded into the result cell (`0.012 mg/L`) to fit. Header wrapping and the `fixed` header row both need a render check. |

## C. Additive — new work — **done**

| # | Reviewer | Comment | Change |
|---|---|---|---|
| C1 | ST | "This bar can just be where the result is in the range against the standard. Like on a health chart. Ideal range and your result visually." | A per-row bar showing the result against its own MCL/SMCL. Replaces the mockup's percentile bar, which compared against other wells and is rejected outright (D). Needs: a scale decision for results far above the limit (log, or a clamped "off the scale" marker), a rendering for parameters with no standard, and a rendering for ND. Sizeable; suggest its own ticket after A and B land. |

## D. N/A — mockup only, and standing constraints

None of the following exist in `ChemistryReportPdf.tsx`; greps for `nearby`,
`percentile`, `median`, `PLSS`, `Supersedes`, `Report ID`, and a collector
column all come back empty.

- **ST (global), SS ×3, MR ×2 — no "nearby well" comparison.** ST: "let's not
  compare to 'nearby' for these reports. Some are very close, many are not
  actually nearby. And proximity is just one view of the issue — also need to
  consider different depths, aquifers, proximity to surface water." SS: "this
  pdf should just be a report of the data with concentrations above MCLs
  flagged." This kills the mockup's nearby median, nearby range, nearby-wells-
  above-limit count, percentile bar, and box-and-whisker figure. Record it as a
  constraint: **no auto-analysis beyond comparison to a published standard.**
- SS — "don't need PLSS on here": no PLSS field.
- SS — "take project off since that's internal": no project field.
- MR/SS/ST — "Supersedes RPT-…", "Report ID", "Scan for the interactive
  version ocotillo.nmbg.nmt.edu/…": no report ID or supersession, and the QR
  points at Weaver, not Ocotillo (`buildWeaverQrDataUrl`).
- MR/SS/ST — collector names and free-text sampling notes ("sometimes things
  are in there that we don't necessarily want the owner to see… Watch out for
  dog!"): the sampling-notes table carries collection date, ion balance,
  pass/review, and a result count. No names, no lab, no note text. The section
  is also off by default.
- SS — "instead of 'how much water was in it'": that phrase is already gone
  from the lede.
- MR (highlight) — "Need latest measured date" on "vs. August 2025": the stat
  already prints a full date via `formatReportDate`.
- MR/SS — field parameters "not that accurate and not as important": the
  `fieldParameters` section already defaults off in
  `CHEMISTRY_REPORT_DEFAULT_SECTIONS`. SS's follow-up ("there is a recommended
  range of") is an unfinished sentence; if the section is ever turned on by
  default, get the intended range from SS.

## E. Decisions — **resolved and applied**

| # | Decision | What was built |
|---|---|---|
| E1 | **Keep the QR code, pointing at Weaver.** | It already encoded a Weaver location URL; the caption now says so — "Scan for this well on Weaver" — instead of the anonymous "Scan for this well's data" that made the destination a guess. |
| E2 | **Drop the year for chemistry; keep it for water levels.** | `fetchChemistryYear` became `fetchAllChemistry` and sends no time window, so the report carries the well's whole chemistry record however old it is. `year` still scopes the manual water levels and the logger summary. The masthead reads "Water levels for 2026", the lede says which half the year applies to, the at-a-glance stat is "Samples on record", and and the exporter no longer offers a year picker at all — it takes the well and the year from the link that reaches it. `chemistryReportYearParams` is gone with its last caller. |
| E3 | **ST meant the project field, which does not exist.** | Nothing to do. Recorded here so the comment is not reopened: the well information grid has never carried a project. |

## Status

Everything in A, B, C, and E is built. `src/test/components/ChemistryReportPdf.test.tsx`
renders the report and reads the text back, so each item is asserted against
what reaches the page rather than against the component tree.

What the chemistry table looks like now, after B5 and C1:

| Parameter | Your result | Maximum contaminant level | Secondary maximum contaminant level | Status | Against the limit | Sampled |
|---|---|---|---|---|---|---|

The last column is C1: a bar for the result with a notch for that parameter's
own limit, captioned `1.2x the limit`. The limit sits at 60% of the track so a
result above it has somewhere to go and the notch stays under the rows above
and below. A parameter with no standard — hardness, which is classified
instead — gets a dash rather than a score against a limit it does not have.

Nothing in the table compares the well with any other well, and the legend
says so in as many words. That is ST's global edit (D) held as a constraint on
new work, not just an absence.

### Still open

- **The `note` field on `DrinkingWaterStandard` is gone**, so there is no longer
  anywhere for a per-parameter explanation to live. If the bureau later wants
  researched, well-specific notes, they need a source that is not a lookup
  table — SS's point was that the explanation varies by well, not that
  explanations are unwanted.
- **Field parameters** stay off by default. SS's "there is a recommended range
  of" is an unfinished sentence; if the section is ever turned on, get the
  intended range from SS.
- **Transducer depth reference** is still unconfirmed, as the PR description
  already notes. The logger summary says "as logged" rather than guessing.
