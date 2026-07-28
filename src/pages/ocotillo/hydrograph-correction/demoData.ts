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
