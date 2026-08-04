import { defineSensorSource } from '../schema'

/**
 * Van Essen Diver telemetry (Diver-NETZ / DiverHQ).
 *
 * Pressure transducers reporting through a DXT/Diver-Gate telemetry unit.
 * Water column is measured as pressure above the sensor; conversion to depth
 * below the measuring point and barometric compensation happen in OcotilloAPI,
 * so the metrics below are already-corrected values.
 *
 * TODO(vendor-docs): `vendor.fieldMap` paths are modelled on the documented
 * DiverHQ device payload but have not been checked against a live response.
 * Confirm each path against the account API docs and correct here -- no other
 * file needs to change.
 */
export const vanEssenDiver = defineSensorSource({
  id: 'van-essen-diver',
  label: 'Van Essen Diver',
  enabled: true,

  transport: {
    kind: 'ocotillo-proxy',
    basePath: 'sensor-source/van-essen-diver',
  },

  vendor: {
    name: 'Van Essen Diver-NETZ',
    consoleUrl: 'https://www.diverhq.com',
    fieldMap: {
      deviceId: { path: 'instrument.serialNumber' },
      label: { path: 'monitoringPoint.name' },
      serialNumber: { path: 'instrument.serialNumber' },
      pointId: { path: 'monitoringPoint.externalId' },
      lastCommunicationAt: { path: 'telemetry.lastContactUtc' },
      lastObservationAt: { path: 'lastMeasurement.timestampUtc' },
      'location.latitude': { path: 'monitoringPoint.latitude' },
      'location.longitude': { path: 'monitoringPoint.longitude' },
      vendorStatus: { path: 'telemetry.status' },
      // Reported 0-1; the dashboard shows a percentage.
      batteryPercent: { path: 'instrument.batteryRemaining', scale: 100 },
      memoryUsedPercent: { path: 'instrument.memoryUsed', scale: 100 },
      signalPercent: { path: 'telemetry.signalQuality', scale: 100 },
      waterLevelFeet: { path: 'lastMeasurement.waterLevel' },
      temperatureCelsius: { path: 'lastMeasurement.temperature' },
    },
  },

  metrics: [
    { key: 'batteryPercent', label: 'Battery', unit: '%', precision: 0 },
    { key: 'signalPercent', label: 'Signal', unit: '%', precision: 0 },
    { key: 'memoryUsedPercent', label: 'Memory', unit: '%', precision: 0 },
    { key: 'waterLevelFeet', label: 'Water level', unit: 'ft', precision: 2 },
    {
      key: 'temperatureCelsius',
      label: 'Temp',
      unit: '°C',
      precision: 1,
    },
  ],

  alertRules: [
    {
      id: 'diver-offline',
      kind: 'stale',
      label: 'Logger has not checked in',
      field: 'lastCommunicationAt',
      // DXT units transmit daily; two missed days is a real problem.
      warnAfterMinutes: 60 * 26,
      criticalAfterMinutes: 60 * 24 * 3,
    },
    {
      id: 'diver-no-data',
      kind: 'stale',
      label: 'No new measurements',
      field: 'lastObservationAt',
      warnAfterMinutes: 60 * 26,
      criticalAfterMinutes: 60 * 24 * 3,
    },
    {
      id: 'diver-battery',
      kind: 'threshold',
      label: 'Battery low',
      metric: 'batteryPercent',
      direction: 'below',
      warnAt: 25,
      criticalAt: 10,
    },
    {
      id: 'diver-memory',
      kind: 'threshold',
      label: 'Logger memory filling up',
      metric: 'memoryUsedPercent',
      direction: 'above',
      warnAt: 80,
      criticalAt: 95,
    },
    {
      id: 'diver-signal',
      kind: 'threshold',
      label: 'Weak telemetry signal',
      metric: 'signalPercent',
      direction: 'below',
      warnAt: 30,
      criticalAt: 15,
    },
    {
      id: 'diver-level-range',
      kind: 'range',
      label: 'Water level outside plausible range',
      metric: 'waterLevelFeet',
      // Sensor above water or absurd depth both indicate a bad reading
      // rather than a real water-level change.
      min: 0,
      max: 1500,
      criticalMin: -5,
      criticalMax: 2000,
    },
    {
      id: 'diver-gap',
      kind: 'gap',
      label: 'Missing records since last transmission',
      // ~24 hourly records expected per day; 24 missed would mean a total
      // outage, which the stale rules already cover.
      warnMissedIntervals: 6,
      criticalMissedIntervals: 12,
    },
  ],

  ingestion: {
    targetResource: 'observation/transducer-groundwater-level',
    parameter: 'groundwater-level',
    // Diver loggers are commonly set to hourly sampling in this network.
    defaultIntervalMinutes: 60,
    allowManualTrigger: true,
  },
})
