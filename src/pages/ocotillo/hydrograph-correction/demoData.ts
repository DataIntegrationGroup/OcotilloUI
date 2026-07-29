// Synthetic companion data for the demo transducer file
// (public/example_transducer.csv). The demo runs without any backend data:
// no well lookup, and these manual observations stand in for Ocotillo
// groundwater-level records.
//
// The demo file carries a +1.25 ft offset in its final third (simulated cable
// slip). The last manual observation reflects the true depth in that stretch,
// so brushing the offset segment and snapping to it demonstrates the
// correction workflow.

export const DEMO_WELL_NAME = 'AR-0209 (demo)'

export const DEMO_FILE_NAME = 'example_transducer.csv'

export const DEMO_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2025-01-25T12:00:00', depth_to_water_bgs: 42.59 },
  { observation_datetime: '2025-02-24T12:00:00', depth_to_water_bgs: 43.1 },
  { observation_datetime: '2025-03-31T12:00:00', depth_to_water_bgs: 43.53 },
]

// Companion data for the Diver Office demo (public/example_diver_office.csv),
// a water-head export: 90 days of 6-hour readings with a stretch of zero
// head around day 30 (sensor out of water, dropped during conversion) and a
// +0.9 ft head offset from day 55 on (cable slip, removable with the Clean
// panel). Sensor depth is ~55 ft for the first two anchors and 55.4 ft for
// the last, so the Correct Drift toggle visibly tilts the trace.
export const DEMO_DIVER_WELL_NAME = 'DM-0107 (demo)'

export const DEMO_DIVER_FILE_NAME = 'example_diver_office.csv'

export const DEMO_DIVER_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2025-01-23T12:00:00', depth_to_water_bgs: 41.67 },
  { observation_datetime: '2025-03-01T12:00:00', depth_to_water_bgs: 42.28 },
  { observation_datetime: '2025-04-13T12:00:00', depth_to_water_bgs: 43.27 },
]

// Companion data for the Wellntel acoustic demo
// (public/example_wellntel.wcsv): 90 days of 6-hour depth-to-water readings
// with 19 spurious reflections systematically offset from the true depth:
// positive 1x (+3.1 ft, longer echo path), negative 1x (-2.4 ft, shorter
// path), 2x double-bounces (~twice the true depth), and one adjacent
// 1x/2x pair. The Remove Reflections button in the Clean panel drops them
// all; values are already DTW, so no water-head conversion is involved.
export const DEMO_WELLNTEL_WELL_NAME = 'WL-0036 (demo)'

export const DEMO_WELLNTEL_FILE_NAME = 'example_wellntel.wcsv'

export const DEMO_WELLNTEL_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2025-01-27T12:00:00', depth_to_water_bgs: 42.17 },
  { observation_datetime: '2025-03-06T12:00:00', depth_to_water_bgs: 42.71 },
  { observation_datetime: '2025-04-10T12:00:00', depth_to_water_bgs: 43.26 },
]

// Demo wells for the Wellntel ingest dialog, used when no Ocotillo well
// with an installed Acoustic Sounder sensor can be found. Names come from
// wellpy's Wellntel POINTID_MAP (real Wellntel installations).
export const DEMO_WELLNTEL_WELLS = [
  { name: 'WL-0036', description: 'Gaume Well' },
  { name: 'SA-0240', description: 'Eileen Dodds Well' },
  { name: 'EB-165', description: 'Moss Farms Well' },
]

// Pretend last-ingested timestamp for demo wells; the dialog uses it as the
// default start bound, mirroring the real flow where the bound comes from
// the latest stored transducer observation.
export const DEMO_WELLNTEL_LAST_INGESTED = '2025-01-15T00:00:00'

// Demo Diver-HUB locations, used when the Diver-HUB API is unreachable
// (or unauthorized). Names line up with the Diver Office demo well so the
// demo manual observations anchor correctly.
export const DEMO_DIVERHUB_LOCATIONS = [
  {
    projectName: 'NMBGMR Demo',
    id: 1,
    uid: null,
    name: 'DM-0107',
    isActive: true,
    monitoringPoints: [{ id: 11, name: 'Screen 1', isActive: true }],
  },
  {
    projectName: 'NMBGMR Demo',
    id: 2,
    uid: null,
    name: 'AR-0209',
    isActive: true,
    monitoringPoints: [{ id: 21, name: 'Screen 1', isActive: true }],
  },
]

const mulberry32 = (seed: number) => {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEMO_READING_INTERVAL_MS = 6 * 60 * 60 * 1000
const DEMO_READING_CAP = 2000

// Synthesizes Diver-HUB water levels for the demo locations: depth to
// water matching the Diver Office demo trend (so the diver demo manual
// observations anchor correctly), with a -0.9 ft cable-slip offset from
// day 55 on that the Clean and Snap tools can correct.
export const generateDemoDiverHubReadings = (start: Date, end: Date) => {
  const rand = mulberry32(20250107)
  const origin = new Date(DEMO_WELLNTEL_LAST_INGESTED).getTime()
  const readings: Array<{ time: Date; value: number }> = []

  for (
    let t = start.getTime();
    t <= end.getTime() && readings.length < 2000;
    t += 6 * 60 * 60 * 1000
  ) {
    const i = (t - origin) / (6 * 60 * 60 * 1000)
    let dtw =
      41.5 + i * 0.004 - 0.05 * Math.sin(i / 6) + (rand() - 0.5) * 0.03
    if (i >= 55 * 4) dtw -= 0.9
    readings.push({ time: new Date(t), value: Number(dtw.toFixed(3)) })
  }

  return readings
}

// Synthesizes Wellntel API readings for the demo wells: the same trend as
// example_wellntel.wcsv, sprinkled with spurious 1x/2x reflections so the
// ingest -> clean workflow can be exercised end to end.
export const generateDemoWellntelReadings = (start: Date, end: Date) => {
  const rand = mulberry32(20250115)
  const origin = new Date(DEMO_WELLNTEL_LAST_INGESTED).getTime()
  const readings: Array<{ time: Date; value: number }> = []
  let previousWasSpurious = true // never start on a reflection

  for (
    let t = start.getTime();
    t <= end.getTime() && readings.length < DEMO_READING_CAP;
    t += DEMO_READING_INTERVAL_MS
  ) {
    const i = (t - origin) / DEMO_READING_INTERVAL_MS
    const trend =
      42.0 + i * 0.0037 + 0.05 * Math.sin(i / 5.5) + (rand() - 0.5) * 0.06

    let value = trend
    const roll = rand()
    if (!previousWasSpurious && roll < 0.05) {
      value = roll < 0.025 ? trend + 3.1 : trend * 2
      previousWasSpurious = true
    } else if (!previousWasSpurious && roll > 0.98) {
      value = trend - 2.4
      previousWasSpurious = true
    } else {
      previousWasSpurious = false
    }

    readings.push({ time: new Date(t), value: Number(value.toFixed(3)) })
  }

  return readings
}
