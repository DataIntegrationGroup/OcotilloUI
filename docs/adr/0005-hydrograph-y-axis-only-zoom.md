---
generated-by: claude
generated-on: 2026-10-06
prompted-by: jirhiker
---

# ADR 0005 — Y-axis-only zoom in the HydroSync workbench

**Status:** Proposed
**Ticket:** [BDMS-1447](https://nmbgmr.atlassian.net/browse/BDMS-1447) (HydroSync MVP, BDMS-1353)
**Date:** 2026-10-06
**Scope:** `OcotilloUI` only — `OcotilloHydrographCorrectionWorkbench.tsx` and
`chartViewport.ts`. No API change.

## Context

When a hydrogeologist inspects the vertical residuals between raw and corrected
data, they need more vertical resolution **without moving the time window**. Every
zoom gesture today either changes time, or changes time and value together.

### What exists today

The workbench draws up to three stacked panels — `head`, `dtw`, `residual` — each
with its own value axis and all sharing one time axis.

| Gesture | Effect |
|---|---|
| Shift + scroll over the plot (BDMS-1442) | zooms **time** for every panel |
| Zoom in / out toolbar buttons | **time** only |
| Zoom box (drag mode) | sets the time window, **and** pins the value axis of the panel the box started in, if the box is tall enough |
| Reset zoom | clears the time zoom and every pinned value axis |

Two facts shape the options:

1. **A Y pin is already independent of the time window.** The per-panel
   `valueWindows` state sets `yAxis.min`/`max` through the chart option, and reset
   already clears it. Changing a pin does not touch the `dataZoom` time window. The
   zoom box just never sets one without the other: `resolveZoomBox` rejects a box
   narrower than 6 px, so a purely vertical drag does nothing.
2. **Plain wheel scrolls the page.** `passPlainWheelToPage` stops plain wheel events
   before the canvas sees them, and `keepZoomWheelOffPage` cancels Shift + wheel
   anywhere in the workspace but off the plot. That ordering was chosen deliberately
   (BDMS-1442) and any option below has to live within it.

### Spike

A real ECharts 5.6 instance (SVG renderer, two stacked panels, 80 px left margin) answers the feasibility questions the options depend on:

| Question | Result |
|---|---|
| Is a pointer in the Y-axis label gutter inside the plot? | No. `containPixel({gridIndex})` is `false` at x = 30. |
| Can a pixel in the gutter still be mapped to a value? | Yes. `convertFromPixel({yAxisIndex}, y)` returns 45 at mid-panel, 50 at the top edge and 40 at the bottom edge of a 40–50 axis, and 150 for the second panel's own axis. |
| Does pinning a Y range disturb the time mapping? | No. After pinning panel 0 to 44–46, the value at the same pixel is 45 and the x pixel still maps to the same time. |
| Can the current visible range be read with no pin set? | Yes, from the panel's top and bottom edge pixels, as above. |

## Options evaluated

**A. Y-only drag mode (toolbar toggle).** A fourth drag mode beside pan / select /
zoom box: drag a vertical band in a panel and that panel's value axis is pinned to
the dragged range. Time is untouched. Reuses `useZoomBoxDrag` and `valueWindows`;
`resolveZoomBox` needs an axis constraint that skips the minimum-width check.
- Pros: precise; discoverable in the toolbar where the other drag modes live; per
  panel by construction; no new keyboard or wheel conflicts.
- Cons: modal — a click to enter, and the mode must be left to pan again. Matches
  the existing modes, so not a new kind of cost.

**B. Shift + scroll over the Y-axis label gutter.** Wheel in the gutter scales that
panel's value range around the value under the cursor.
- Pros: direct manipulation; no mode; the same Shift + scroll the plot already uses,
  with the gutter standing for "the axis under the pointer"; Shift + wheel there is
  currently swallowed, so there is nothing to conflict with; the spike confirms the
  pixel-to-value mapping.
- Cons: low discoverability and a narrow target (the 100 px left margin); needs its
  own listener and a hint; trackpad Shift + two-finger scroll may arrive as a
  horizontal delta, which zrender already normalises for the plot but would need
  handling here.

**C. Modifier + scroll over the plot (for example Alt + Shift).** One more modifier
turns the plot's zoom into value-only zoom.
- Pros: no new target or mode.
- Cons: poor discoverability; Alt + scroll is claimed by some Linux window managers,
  and Ctrl (the usual choice) is what BDMS-1442 moved away from because of browser
  zoom. Rejected.

**D. "Lock time" toggle.** While on, every zoom gesture and button changes only the
value axis.
- Pros: reuses every existing gesture, including the toolbar buttons.
- Cons: hidden state. A reader who forgets the lock is on will report that time zoom
  is broken. Weakest on error prevention.

**E. ECharts value-axis `dataZoom` (slider or inside).** Built in.
- Cons: a second range mechanism that competes with `valueWindows`; a slider per
  panel adds clutter to a chart that already uses its width for the legend; it
  would need its filter mode chosen with care for the residual series. Rejected.

**F. Drag the axis to scale it.** Grab the Y-axis gutter and drag, as in trading
charts.
- Pros: direct.
- Cons: same narrow target as B with a weaker affordance. Can be added later on top
  of B's geometry if wanted.

## Recommendation

Build **A and B together**, in that order:

1. **A first.** It is the clearest answer to the ticket, discoverable, and nearly
   free: the state, the axis pinning and the reset all exist.
2. **B second**, as the fast path for people who already know the Shift + scroll
   habit. It also gives a way to zoom a Y range back **out** in small steps, which
   A does not.

Both act on one panel at a time (the one the pointer is in), because the three
panels have unrelated units and scales. Both feed `valueWindows`, so **Reset zoom**
already clears them with no new code, and the existing "isZoomed" indicator already
covers them.

Not recommended: C, D, E.

## Implementation sketch

- `chartViewport.ts`: give `resolveZoomBox` an `axis: 'both' | 'y'` option; for `'y'`
  skip the minimum-width check and return `time: null`. Add a pure
  `scaleValueRange(range, factor, anchor)` for B, tested like `scaleZoomWindow`.
- Workbench: add `'zoomY'` to `ChartDragMode` with a toolbar toggle and hint; in
  `zoomToBox`, dispatch the time `dataZoom` only when `box.time` is present.
- B: a wheel listener on the chart container for Shift + wheel when the pointer is in
  a panel's gutter, which reads the current range from the panel's edge pixels when
  nothing is pinned, scales it around `convertFromPixel({yAxisIndex}, y)`, and calls
  `setValueWindows`. Extend the toolbar hint.
- Tests: pure-function tests for both helpers; a workbench test that a Y-only drag
  leaves the `dataZoom` window untouched and pins only the dragged panel.

## Open questions

- Should Y zoom also be reachable from the keyboard? Not required by the ticket.
- A minimum visible span for B, so a runaway scroll cannot collapse the axis to a
  point. Suggest a floor relative to the data's own range.
- Whether the residual panel should open with a tighter default range, which would
  reduce how often anyone needs this. Out of scope here.

## Not verified

The spike ran against ECharts directly, not the full workbench in a browser, so the
gutter hit-test geometry and the Shift + wheel behaviour on trackpads and macOS are
unconfirmed.
