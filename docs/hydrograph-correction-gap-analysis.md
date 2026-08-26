# Hydrograph Correction — Gap Analysis Against Real Artifacts

Date: 2026-07-29
Inputs: real wellpy artifacts (`sa-0231_DK744_compensated.CSV`,
`EB-165.wcsv`, `2025-11-25_MG009.txt`) and the NMBGMR *Procedure for
Collecting and Processing Continuous Depth-to-Water Data* (Dec 2022).
Every finding below was verified empirically by running the artifact
through the current parser/filters.

## Verdict summary

| Artifact | Result today | Severity |
|---|---|---|
| `sa-0231_DK744_compensated.CSV` (real Diver Office export) | **Fails to parse** — "No hydrograph rows could be parsed" | Critical |
| `2025-11-25_MG009.txt` (field data logger telemetry) | **Fails to parse** — unsupported format | Critical |
| `EB-165.wcsv` (real Wellntel export) | Parses, but reflection filter leaves **131 of ~299 spurious readings** | High |
| Methodology PDF | Conversion math matches eq. (2)/(3), but single-anchor flow and QC diagnostics missing | Medium |

## 1. Real Diver Office CSV fails to parse (critical)

The real export differs from the synthetic demo file in ways that break
two assumptions:

- **Delimiter sniffing picks `|`.** The first 20 lines are the metadata
  block, which contains no commas but two pipes (in
  `COMP.STATUS: ... (Barometer: ... | Serial number: DL572 | ...)`).
  `detectDelimiter` samples only the first 20 lines, scores `|` highest,
  and every data row then becomes a single cell. The header row is still
  "found" (the whole string matches both time and value patterns), but
  the datetime and value columns collapse to the same cell and zero rows
  parse. Fix: sniff the delimiter from the rows at/after the detected
  header row, or re-sniff when the first pass yields no rows.
- **`Location` is not a recognized point-id pattern.** The real file
  identifies the well only via `Location                =sa-0231`.
  `POINT_ID_PATTERNS` knows `thing.name`, `point id`, `well name`, and
  `site id` — not `Location` — so even after a delimiter fix the well
  cannot auto-resolve. (`parseDiverOfficeUpload` knows `Location=`, but
  this file never reaches that code path because it *has* a proper
  header row, `Date/time,Water head[ft],Temperature[°C]`, so the generic
  parser handles it.)
- Also worth noting from the real file: `°C` arrives as a non-UTF8 byte
  (Diver Office writes Windows-1252 — parsing must not choke on it), the
  header uses `Water head[ft]` with no space before the bracket, dates
  are `2024/02/20 12:00:00`, and the terminator line is
  `END OF DATA FILE OF DATALOGGER FOR WINDOWS` (our Diver detector
  matches `END OF DATA` as a prefix, so that part is fine).
- The metadata block carries values we currently ignore that the
  methodology makes meaningful: `Sample period =H12` (12-hour cadence),
  `Reference level`/`Range` per channel (overpressurization bounds), and
  the barometer used for compensation (provenance).

## 2. Field data logger telemetry format unsupported (critical)

`2025-11-25_MG009.txt` is the "Field Data Logger Methodology" format —
telemetered readings, one line per record, space-delimited tokens:

```
2024/11/19 18:54:05   ID 009  D  151.02  T  51.2  B 13.9  G 218  R 0001
```

`D` is already depth to water (ft), `T` temperature (°F), `B` battery
voltage, `G` signal, `R` restart flag. No header, no commas — the
current parser errors immediately ("Unable to detect a header row").
Needs a dedicated line-format parser (regex per row), `valueKind:
'depth_to_water'`, station id from the `ID` token or filename
(`MG009` → MG-009). Battery voltage is worth surfacing: the methodology
replaces loggers below 75% battery, so a declining `B` column is a QC
signal at ingest time.

## 3. Reflection filter defeated by dense clusters (high)

EB-165 is far harsher than the synthetic demo. Real characteristics:

- Spurious readings are **systematically positive** and **multi-modal**:
  baseline ~478.5 ft with populations near +3.3, +7, +11, +15 ft —
  consistent with n-bounce echo multiples, exactly the 1x/2x behavior
  described earlier but at several multiples.
- They are **dense and clustered**: in some stretches (e.g. mid-May and
  May 18–20, 2023) a third to all of consecutive readings are spurious.
  Six consecutive readings at ~481.9 look exactly like a sustained step.
- They are **temperature-correlated**: the spurious population is
  overwhelmingly the warm evening (~20:00) readings — the parsed-away
  `temperature_C` column carries real discriminating signal.

Measured performance of the current median-window filter on the real
file (405 rows, ~299 readings above the 478–479.5 ft trend band):
removes 168 at the 0.25 ft threshold, **131 spurious readings survive**
— adjacent spurious readings rescue each other via the
neighbor-agreement rule, and the 7-sample median itself is contaminated
when half the window is spurious.

What would close the gap:

- **Running-baseline filter** (wellpy's `remove_up_spikes` normal mode,
  which this well's data clearly motivated): track the last accepted
  clean value; reject any reading more than the threshold *above* it
  (reflections here are one-sided). Handles arbitrarily long spurious
  runs.
- Optionally **mode-based baseline**: the true trace is the lowest
  density mode; take a rolling lower quantile (e.g. 20th percentile over
  a 2-day window) as baseline and drop readings > threshold above it.
- Optionally **temperature-aware assist**: flag readings whose
  temperature is far above the daily median as reflection-suspect.
  Requires keeping the temperature column through parsing (currently
  discarded for `.wcsv`).

## 4. Methodology alignment (medium)

The PDF confirms several design decisions and exposes a few gaps:

Confirmed correct:
- DTW conversion math matches eq. (2)/(3): calculated hanging point =
  manual DTW + head, series DTW = hanging point − head. Our
  anchor-pair conversion generalizes eq. (3) between bounding manuals.
- `release_status: provisional` on publish, independent review to
  approved, then public release — matches the QC process section and
  the existing block `review_status` model.
- Zero/near-zero head handling ("water column above Diver dropped to
  zero") and cable-slip re-leveling match documented failure modes.

Gaps:
- **Single-anchor conversion.** The documented workflow anchors the
  whole series on *one* selected manual measurement (Snap to Selected →
  eq. 2 → eq. 3). Our converter requires ≥ 2 overlapping manual
  observations and throws otherwise. A series with only the one manual
  taken at download day — the common case per the methodology (annual
  visits) — cannot be converted today. Support a single-anchor mode:
  constant hanging point from the chosen manual.
- **Drift diagnostic.** The methodology's key QC test: does the
  converted series pass through *both* bounding manual measurements
  (each repeatable within 0.02 ft)? If not, the logger is drifting and
  the data must **not** be uploaded. We offer drift *correction* but no
  drift *detection* — the workbench should report the misfit (ft) at
  each bounding manual and warn when it exceeds a tolerance, before
  Publish.
- **Manual-measurement quality.** The methodology classifies manuals by
  repeatability (±0.02 ft) and distrusts low-quality ones as anchors.
  Ties into the planned omission feature (session task #1): omission
  should be informed by the measurement's stored quality flag, not only
  hand-picked.
- **Overpressurization clipping.** A Diver pushed past its range records
  its maximum pressure — a flat-topped plateau. Not detected today; a
  "flatline at series max" check would catch it (the `Range` metadata in
  the Diver header gives the exact ceiling).

## Recommended order of work

1. ✅ Fix Diver Office CSV parsing (500-line delimiter sample + `Location`
   point-id pattern with compact-id normalization). Real export is a
   committed regression fixture.
2. ✅ Field-data-logger `.txt` parser with low-battery warning surfaced on
   the page. Real telemetry file is a committed fixture.
3. ✅ Dense-cluster reflection mode: 'baseline' detection flags readings
   above the trailing lower quantile of a 15-sample window — clears
   EB-165's clusters (nothing above 486 survives) while following the
   genuine ~3.5 ft July rise. Selectable in the Clean panel.
   *Deferred*: temperature-aware assist (temperature is still dropped at
   parse time).
4. ✅ Single-anchor head→DTW conversion (constant calculated hanging point
   per methodology eq. 2/3).
5. ✅ Drift diagnostic: converted water-head series is checked against
   every in-coverage manual; misfits > 0.1 ft raise a workbench warning
   citing the methodology's do-not-publish guidance.
6. ✅ Overpressurization detection: a plateau of ≥ 6 readings at the raw
   head's maximum raises a clipping warning.

Remaining from the analysis: manual-measurement quality flags feeding
anchor selection/omission (session task #1), and the temperature-aware
reflection assist.
