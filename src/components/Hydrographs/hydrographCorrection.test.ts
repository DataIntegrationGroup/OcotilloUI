import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  applyOffsetToRange,
  calculateSnapOffset,
  extractPointIdFromText,
  normalizePointId,
  parseHydrographUpload,
  parseHydrographWorkbookUpload,
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
