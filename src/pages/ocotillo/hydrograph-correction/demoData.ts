// The file demos load REAL artifacts (bundled in public/, also committed
// as regression fixtures under tmp/wellpy-samples). The demos run without
// any backend data: no well lookup, and these manual observations stand in
// for Ocotillo groundwater-level records, with values derived from the
// artifacts themselves so conversion/snap anchor correctly.

// Field data logger telemetry (2025-11-25_MG009.txt): a year of 8-hour
// depth-to-water records. Manual anchors are readings from the file.
export const DEMO_WELL_NAME = 'MG-009 (demo)'

export const DEMO_FILE_NAME = '2025-11-25_MG009.txt'

export const DEMO_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2024-11-20T18:54:00', depth_to_water_bgs: 149.29 },
  { observation_datetime: '2025-05-15T16:42:00', depth_to_water_bgs: 150.25 },
  { observation_datetime: '2025-11-07T00:42:00', depth_to_water_bgs: 151.36 },
]

// Real Diver Office compensated export (sa-0231_DK744_compensated.CSV):
// a year of 12-hour water-head readings, including a genuine ~8 ft
// recharge event in August 2024. Anchors assume a constant hanging point
// of 120 ft (DTW = 120 - head), so conversion reproduces them exactly.
export const DEMO_DIVER_WELL_NAME = 'SA-0231 (demo)'

export const DEMO_DIVER_FILE_NAME = 'sa-0231_DK744_compensated.CSV'

export const DEMO_DIVER_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2024-02-20T12:00:00', depth_to_water_bgs: 96.9 },
  { observation_datetime: '2024-08-14T00:00:00', depth_to_water_bgs: 99.3 },
  { observation_datetime: '2025-02-11T00:00:00', depth_to_water_bgs: 93.43 },
]

// Real Wellntel acoustic export (EB-165.wcsv): ~5 months of readings with
// dense temperature-correlated spurious reflections (1x and deeper
// multiples) and a genuine ~3.5 ft seasonal rise into July — the dataset
// the baseline detection method and temperature assist were built for.
// Anchors are clean readings from the file.
export const DEMO_WELLNTEL_WELL_NAME = 'EB-165 (demo)'

export const DEMO_WELLNTEL_FILE_NAME = 'EB-165.wcsv'

export const DEMO_WELLNTEL_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2023-03-01T13:06:00', depth_to_water_bgs: 478.09 },
  { observation_datetime: '2023-05-21T11:39:00', depth_to_water_bgs: 478.67 },
  { observation_datetime: '2023-07-22T10:31:00', depth_to_water_bgs: 482.32 },
]

// Synthetic manual observations for the INGEST dialog demos, aligned with
// the synthetic reading generators below (42-ft trend) rather than the
// real file demos above.
export const INGEST_WELLNTEL_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2025-01-27T12:00:00', depth_to_water_bgs: 42.17 },
  { observation_datetime: '2025-03-06T12:00:00', depth_to_water_bgs: 42.71 },
  { observation_datetime: '2025-04-10T12:00:00', depth_to_water_bgs: 43.26 },
]

export const INGEST_DIVER_MANUAL_OBSERVATIONS = [
  { observation_datetime: '2025-01-23T12:00:00', depth_to_water_bgs: 41.67 },
  { observation_datetime: '2025-03-01T12:00:00', depth_to_water_bgs: 42.28 },
  { observation_datetime: '2025-04-13T12:00:00', depth_to_water_bgs: 43.27 },
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
