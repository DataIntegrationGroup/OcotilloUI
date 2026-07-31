import { defineSensorSource } from '../schema'

/**
 * Wellntel acoustic water-level sensors.
 *
 * A Wellntel install is a sensor on the wellhead paired with a gateway that
 * uploads to the Wellntel cloud. Readings are acoustic depth-to-water, so a
 * failing sensor tends to show up as dropped/implausible readings rather than
 * a clean offline signal -- hence the tighter `gap` and `range` rules than the
 * Diver source uses.
 *
 * TODO(vendor-docs): `vendor.fieldMap` paths are modelled, not verified.
 * Check against the Wellntel account API docs and correct here -- no other
 * file needs to change.
 */
export const wellntel = defineSensorSource({
  id: 'wellntel',
  label: 'Wellntel',
  enabled: true,

  transport: {
    kind: 'ocotillo-proxy',
    basePath: 'sensor-source/wellntel',
  },

  vendor: {
    name: 'Wellntel Insights',
    consoleUrl: 'https://my.wellntel.com',
    fieldMap: {
      deviceId: { path: 'sensor.id' },
      label: { path: 'well.name' },
      serialNumber: { path: 'sensor.serial' },
      pointId: { path: 'well.external_id' },
      lastCommunicationAt: { path: 'gateway.last_seen_at' },
      lastObservationAt: { path: 'latest_reading.recorded_at' },
      'location.latitude': { path: 'well.latitude' },
      'location.longitude': { path: 'well.longitude' },
      vendorStatus: { path: 'sensor.status' },
      batteryPercent: { path: 'sensor.battery_level' },
      signalPercent: { path: 'gateway.signal_strength' },
      depthToWaterFeet: { path: 'latest_reading.depth_to_water_ft' },
      // Wellntel scores each acoustic return; low confidence means the
      // reading is probably an echo off casing rather than the water surface.
      readingConfidence: { path: 'latest_reading.confidence' },
    },
  },

  metrics: [
    { key: 'batteryPercent', label: 'Battery', unit: '%', precision: 0 },
    { key: 'signalPercent', label: 'Signal', unit: '%', precision: 0 },
    {
      key: 'depthToWaterFeet',
      label: 'Depth to water',
      unit: 'ft',
      precision: 2,
    },
    {
      key: 'readingConfidence',
      label: 'Confidence',
      unit: '%',
      precision: 0,
    },
  ],

  alertRules: [
    {
      id: 'wellntel-gateway-offline',
      kind: 'stale',
      label: 'Gateway has not checked in',
      field: 'lastCommunicationAt',
      // Gateways report several times a day, so silence is noticed sooner.
      warnAfterMinutes: 60 * 8,
      criticalAfterMinutes: 60 * 24,
    },
    {
      id: 'wellntel-no-data',
      kind: 'stale',
      label: 'No new readings',
      field: 'lastObservationAt',
      warnAfterMinutes: 60 * 12,
      criticalAfterMinutes: 60 * 24 * 2,
    },
    {
      id: 'wellntel-battery',
      kind: 'threshold',
      label: 'Battery low',
      metric: 'batteryPercent',
      direction: 'below',
      warnAt: 30,
      criticalAt: 15,
    },
    {
      id: 'wellntel-signal',
      kind: 'threshold',
      label: 'Weak gateway signal',
      metric: 'signalPercent',
      direction: 'below',
      warnAt: 30,
      criticalAt: 15,
    },
    {
      id: 'wellntel-confidence',
      kind: 'threshold',
      label: 'Low acoustic reading confidence',
      metric: 'readingConfidence',
      direction: 'below',
      warnAt: 70,
      criticalAt: 50,
    },
    {
      id: 'wellntel-depth-range',
      kind: 'range',
      label: 'Depth to water outside plausible range',
      metric: 'depthToWaterFeet',
      min: 0,
      max: 1200,
      criticalMin: -2,
      criticalMax: 2000,
    },
    {
      id: 'wellntel-gap',
      kind: 'gap',
      label: 'Missing readings since last upload',
      // Only ~6 readings are expected per day at a 4h interval, so the
      // thresholds have to be small to be reachable at all.
      warnMissedIntervals: 2,
      criticalMissedIntervals: 4,
    },
  ],

  ingestion: {
    targetResource: 'observation/transducer-groundwater-level',
    parameter: 'groundwater-level',
    // Wellntel sensors typically report every 4 hours.
    defaultIntervalMinutes: 240,
    allowManualTrigger: true,
  },
})
