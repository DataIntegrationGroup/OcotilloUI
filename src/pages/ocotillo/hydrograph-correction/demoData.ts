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
