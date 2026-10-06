---
generated-by: claude-opus-5-5
generated-on: 2026-09-24
prompted-by: jakeross
---

# Hydrograph Correction — Drift Correction

Ticket: BDMS-1300. Covers what "Correct drift" does in the hydrograph
correction workbench today, how the UI now explains and previews it, and an
assessment of anchor-based interpolation as a future enhancement.

Code: `convertWaterHeadToDepthToWater` and `describeSensorDepthAnchors` in
`src/components/Hydrographs/hydrographCorrection.ts`; the checkbox and
preview in `OcotilloHydrographCorrectionWorkbench.tsx`.

## Current behavior

"Correct drift" only appears for **water-head** uploads (Diver Office
pressure transducers). Depth-to-water uploads are used as-is and have no
drift option.

Water head is the height of the water column above the sensor, so

```
depth to water = sensor depth (L) - head
```

The sensor depth is not known directly. It is anchored at each manual
observation: at a manual taken at time `t` with depth `d`, `L = d + head(t)`,
with `head(t)` interpolated at the manual's own timestamp rather than taken
from the nearest reading.

| Manuals | Drift off | Drift on |
|---|---|---|
| One | Constant `L` from that manual across the whole series. | Same — nothing to ramp between. |
| Two or more | Each interval between consecutive manuals uses `L1`, the sensor depth at its **closing** manual (wellpy parity). | `L` ramps linearly from `L0` to `L1` across the interval, so the trace passes through **both** manuals. |

Edge rules, identical in both modes:

- Readings with zero head (sensor out of water) are dropped.
- A manual outside the logged record has no head to anchor on. That end is
  left unanchored and the interval is held constant at the other end's
  sensor depth; it is never ramped toward an invented value.
- Readings before the first manual or after the last use the nearest
  interval's sensor depth instead of wellpy's zero, so the trace stays
  plottable.

What drift *off* implies: when the logger has drifted, the trace meets the
closing manual of each interval and misses the opening one by the drift
amount, and it steps at each manual. The QC warning ("Drift check: the
converted series misses the manual measurement…") and the residual panel
report that misfit.

### What toggling recalculates

Changing the setting re-derives the working series from the uploaded water
head. Every correction applied since the upload — offset/zero removal,
reflection edits, shifts, snaps — is discarded, and the correction log
restarts at `convert_water_head` or `convert_water_head (drift corrected)`.

## UI changes in BDMS-1300

Before, ticking the checkbox re-derived immediately and silently dropped
manual edits. Now:

1. Toggling stages the change. The working series is untouched.
2. A preview panel says what applying would do:
   - how many readings move from the current result and the largest change;
   - with drift on, each interval's sensor-depth ramp (`L0` to `L1`) and its
     drift, and how many intervals stay constant because a manual is outside
     the record;
   - the manual edits that would be discarded, listed from the correction
     log, or that there are none.
3. The chart draws the candidate as a dashed "Drift correction preview"
   trace next to the current "Uploaded corrected" trace.
4. **Apply** re-derives with the new setting. **Cancel**, toggling back, or
   **Reset** drops the preview.

## Assessment: anchor-based interpolation as an enhancement

Drift on is already linear interpolation — of the *sensor depth* between
manual anchors, inside the water-head conversion. The enhancement worth
evaluating is a separate operation: **interpolate the residual at manual
anchors and subtract it**.

At each manual inside the record, residual `r = series(t) - manual`. Between
consecutive anchors, subtract `r` interpolated linearly in time. Applied to
the drift-off conversion of a water-head upload, this gives exactly the
drift-on result: the residual is `L1 - L0` at the opening manual and zero at
the closing one. Its value is in where else it applies.

What it would add:

- **Depth-to-water uploads** (already-compensated exports, wellpy
  `.wcsv`) could be drift-corrected. Today they cannot.
- It is an **edit, not a re-derive**, so it can run after other corrections
  without discarding them, be scoped to a brushed range, and appear in the
  correction log like a shift or snap.
- Anchors could be **chosen**, so the user can exclude a manual they
  distrust (for example, one with an unusual collector note) instead of the
  conversion using every manual.

Risks and open questions:

- **It hides a failing logger.** The methodology treats a misfit beyond
  the manuals' repeatability (about 0.02 ft) as a reason *not* to publish
  without review. An easy fix makes that easy to skip. Any version should
  keep the drift QC warning visible and record the per-anchor residuals it
  removed in the log.
- **Linear drift is an assumption.** Barometric compensation errors and
  cable stretch are not necessarily linear in time. Over multi-year
  intervals with one visit a year, interpolation could introduce shape
  errors as large as the drift it removes.
- **Manual quality varies.** A single bad manual bends every reading in the
  two intervals it bounds.
- **Overlap with snap.** Snap-to-manual already removes a constant offset
  at one anchor. The UI would need to make clear that interpolation is
  snap generalized to a slope between two anchors.

Recommendation: do not build it yet. Revisit if users need drift
correction on depth-to-water uploads, since that is the one case the
current tool cannot cover. If it goes ahead, scope it as a range-scoped
edit that requires two anchors inside the range, shows the same kind of
preview as this ticket, and logs each anchor's removed residual.
