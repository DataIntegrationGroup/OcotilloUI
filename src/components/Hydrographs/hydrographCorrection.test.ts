import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  applyOffsetToRange,
  calculateSnapOffset,
  convertWaterHeadToDepthToWater,
  extractPointIdFromText,
  normalizePointId,
  parseHydrographUpload,
  parseHydrographWorkbookUpload,
  removeOffsetsAndZeros,
  removeSpuriousReflections,
} from './hydrographCorrection'

describe('hydrograph correction utilities', () => {
  it('extracts and normalizes a point id from metadata text', () => {
    expect(extractPointIdFromText('Thing.Name: so-0167')).toBe('SO-0167')
    expect(normalizePointId('  so-0167 ')).toBe('SO-0167')
  })

  it('parses a tab-delimited upload with combined datetime values', () => {
    const parsed = parseHydrographUpload(`PointID: SO-0167
Date Time\tDepth To Water
2025-01-01 00:00:00\t12.5
2025-01-01 01:00:00\t12.7`)

    expect(parsed.pointId).toBe('SO-0167')
    expect(parsed.measurements).toHaveLength(2)
    expect(parsed.detectedTimeColumn).toBe('Date Time')
    expect(parsed.detectedValueColumn).toBe('Depth To Water')
    expect(parsed.measurements[0].value).toBe(12.5)
  })

  it('parses separate date and time columns', () => {
    const parsed = parseHydrographUpload(`thing.name,Date,Time,Water Level
SO-0200,2025-02-01,12:00:00,44.1
SO-0200,2025-02-01,13:00:00,44.2`)

    expect(parsed.pointId).toBe('SO-0200')
    expect(parsed.detectedTimeColumn).toBe('Date + Time')
    expect(parsed.measurements[1].time.getTime()).toBe(
      new Date('2025-02-01 13:00:00').getTime()
    )
  })

  it('applies an offset only inside the selected range', () => {
    const measurements = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
      { time: new Date('2025-01-02T00:00:00Z'), value: 11 },
      { time: new Date('2025-01-03T00:00:00Z'), value: 12 },
    ]

    const shifted = applyOffsetToRange(measurements, 1.5, {
      startTime: new Date('2025-01-02T00:00:00Z'),
      endTime: new Date('2025-01-03T00:00:00Z'),
    })

    expect(shifted.map((point) => point.value)).toEqual([10, 12.5, 13.5])
  })

  it('calculates the offset needed to snap to the nearest manual point', () => {
    const offset = calculateSnapOffset({
      measurements: [
        { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
        { time: new Date('2025-01-02T00:00:00Z'), value: 12 },
      ],
      target: {
        time: new Date('2025-01-02T06:00:00Z'),
        value: 11.25,
      },
    })

    expect(offset).toBe(-0.75)
  })

  it('parses a Diver Office pressure-transducer export as water head', () => {
    const parsed = parseHydrographUpload(`Data file for DataLogger.
Serial number=V5806  1250
Location=SO-0167
2025-01-01 00:00:00,10.000,14.1
2025-01-01 06:00:00,10.500,14.2
2025-01-01 12:00:00,9.800,14.1,412.0
END OF DATA`)

    expect(parsed.valueKind).toBe('water_head')
    expect(parsed.pointId).toBe('SO-0167')
    expect(parsed.measurements).toHaveLength(3)
    expect(parsed.measurements[1].value).toBe(10.5)
    expect(parsed.detectedValueColumn).toBe('Water head (ft)')
  })

  it('parses a Wellntel acoustic wcsv export as depth to water', () => {
    const parsed = parseHydrographUpload(`timestamp,temperature_C,temperature_raw,depth
2025-01-01 00:00:00,21.5,708,42.1
2025-01-01 06:00:00,21.4,707,42.2`)

    expect(parsed.valueKind).toBe('depth_to_water')
    expect(parsed.detectedTimeColumn).toBe('timestamp')
    expect(parsed.detectedValueColumn).toBe('depth')
    expect(parsed.measurements.map((point) => point.value)).toEqual([
      42.1, 42.2,
    ])
  })

  it('converts water head to depth to water anchored on manual observations', () => {
    const measurements = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
      { time: new Date('2025-01-02T00:00:00Z'), value: 10.5 },
      { time: new Date('2025-01-03T00:00:00Z'), value: 9.8 },
      { time: new Date('2025-01-04T00:00:00Z'), value: 9.6 },
    ]
    const manualPoints = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 50 },
      { time: new Date('2025-01-04T00:00:00Z'), value: 52 },
    ]

    // Bin covers the first three points; L1 = 52 + 9.8 = 61.8. The final
    // point falls at the second manual observation and extends the last
    // bin's sensor depth.
    const converted = convertWaterHeadToDepthToWater({
      measurements,
      manualPoints,
    })

    expect(converted.map((point) => point.value)).toEqual([
      51.8, 51.3, 52, 52.2,
    ])
  })

  it('drops zero-head readings before converting', () => {
    const converted = convertWaterHeadToDepthToWater({
      measurements: [
        { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
        { time: new Date('2025-01-02T00:00:00Z'), value: 0 },
        { time: new Date('2025-01-03T00:00:00Z'), value: 9.8 },
      ],
      manualPoints: [
        { time: new Date('2025-01-01T00:00:00Z'), value: 50 },
        { time: new Date('2025-01-04T00:00:00Z'), value: 52 },
      ],
    })

    expect(converted).toHaveLength(2)
    expect(converted.map((point) => point.value)).toEqual([51.8, 52])
  })

  it('interpolates the sensor depth when drift correction is enabled', () => {
    const measurements = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
      { time: new Date('2025-01-02T00:00:00Z'), value: 10.5 },
      { time: new Date('2025-01-03T00:00:00Z'), value: 9.8 },
    ]
    const manualPoints = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 50 },
      { time: new Date('2025-01-03T06:00:00Z'), value: 52 },
    ]

    // L0 = 50 + 10 = 60, L1 = 52 + 9.8 = 61.8, interpolated across the
    // covered span, so the trace starts exactly at the first manual value.
    const converted = convertWaterHeadToDepthToWater({
      measurements,
      manualPoints,
      correctDrift: true,
    })

    expect(converted.map((point) => point.value)).toEqual([50, 50.4, 52])
  })

  it('requires two overlapping manual observations to convert water head', () => {
    const measurements = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
    ]

    expect(() =>
      convertWaterHeadToDepthToWater({
        measurements,
        manualPoints: [{ time: new Date('2025-01-01T00:00:00Z'), value: 50 }],
      })
    ).toThrow('At least two manual observations')

    expect(() =>
      convertWaterHeadToDepthToWater({
        measurements,
        manualPoints: [
          { time: new Date('2026-01-01T00:00:00Z'), value: 50 },
          { time: new Date('2026-02-01T00:00:00Z'), value: 51 },
        ],
      })
    ).toThrow('do not overlap')
  })

  it('removes zeros and cancels offset jumps beyond the threshold', () => {
    const measurements = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
      { time: new Date('2025-01-02T00:00:00Z'), value: 10.1 },
      { time: new Date('2025-01-03T00:00:00Z'), value: 0 },
      { time: new Date('2025-01-04T00:00:00Z'), value: 12.1 },
      { time: new Date('2025-01-05T00:00:00Z'), value: 12.2 },
      { time: new Date('2025-01-06T00:00:00Z'), value: 12.3 },
    ]

    const cleaned = removeOffsetsAndZeros(measurements, 0.25)

    expect(cleaned.map((point) => point.value)).toEqual([
      10, 10.1, 10.1, 10.2, 10.3,
    ])
  })

  it('removes isolated spurious reflections in either direction', () => {
    const day = (n: number, value: number) => ({
      time: new Date(Date.UTC(2025, 0, n)),
      value,
    })
    const measurements = [
      day(1, 42.0),
      day(2, 42.05),
      day(3, 45.15), // spurious deep echo
      day(4, 42.1),
      day(5, 39.9), // spurious shallow echo
      day(6, 42.15),
      day(7, 42.2),
    ]

    const cleaned = removeSpuriousReflections(measurements, 0.25)

    expect(cleaned.map((point) => point.value)).toEqual([
      42.0, 42.05, 42.1, 42.15, 42.2,
    ])
  })

  it('keeps genuine steps and points outside the selected range', () => {
    const day = (n: number, value: number) => ({
      time: new Date(Date.UTC(2025, 0, n)),
      value,
    })

    // A sustained two-sample offset is a real step, not a reflection.
    const step = [day(1, 42), day(2, 45), day(3, 45.05), day(4, 42.1)]
    expect(removeSpuriousReflections(step, 0.25)).toHaveLength(4)

    // A reflection outside the brushed range is untouched.
    const spike = [day(1, 42), day(2, 45.1), day(3, 42.05), day(4, 42.1)]
    const cleaned = removeSpuriousReflections(spike, 0.25, {
      startTime: new Date(Date.UTC(2025, 0, 3)),
      endTime: new Date(Date.UTC(2025, 0, 4)),
    })
    expect(cleaned).toHaveLength(4)
  })

  it('only cancels jumps inside the selected range', () => {
    const measurements = [
      { time: new Date('2025-01-01T00:00:00Z'), value: 10 },
      { time: new Date('2025-01-02T00:00:00Z'), value: 12 },
      { time: new Date('2025-01-03T00:00:00Z'), value: 12.1 },
    ]

    const cleaned = removeOffsetsAndZeros(measurements, 0.25, {
      startTime: new Date('2025-01-02T12:00:00Z'),
      endTime: new Date('2025-01-03T12:00:00Z'),
    })

    expect(cleaned.map((point) => point.value)).toEqual([10, 12, 12.1])
  })

  it('parses the sample wellpy workbook export', () => {
    const path = resolve(
      process.cwd(),
      'tmp/wellpy-samples/AR0209_AztecMW.xlsx'
    )
    const buffer = readFileSync(path)
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer

    const parsed = parseHydrographWorkbookUpload(
      arrayBuffer,
      'AR0209_AztecMW.xlsx'
    )

    expect(parsed.detectedTimeColumn).toBe('Date/time')
    expect(parsed.detectedValueColumn).toContain('DTW')
    expect(parsed.measurements.length).toBeGreaterThan(300)
    expect(parsed.pointId).toBe('AR-0209')
  })
})
