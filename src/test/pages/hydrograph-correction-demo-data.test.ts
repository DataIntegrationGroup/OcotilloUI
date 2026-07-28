import { describe, expect, it } from 'vitest'
import {
  DEMO_WELLNTEL_LAST_INGESTED,
  generateDemoWellntelReadings,
} from '@/pages/ocotillo/hydrograph-correction/demoData'
import { removeSpuriousReflections } from '@/components/Hydrographs/hydrographCorrection'

describe('generateDemoWellntelReadings', () => {
  const start = new Date(DEMO_WELLNTEL_LAST_INGESTED)
  const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)

  it('produces a deterministic 6-hour series within the requested bounds', () => {
    const first = generateDemoWellntelReadings(start, end)
    const second = generateDemoWellntelReadings(start, end)

    expect(first.length).toBe(361)
    expect(first[0].time.getTime()).toBe(start.getTime())
    expect(first[1].time.getTime() - first[0].time.getTime()).toBe(
      6 * 60 * 60 * 1000
    )
    expect(first[first.length - 1].time.getTime()).toBeLessThanOrEqual(
      end.getTime()
    )
    expect(second.map((point) => point.value)).toEqual(
      first.map((point) => point.value)
    )
  })

  it('seeds spurious reflections that the reflection filter removes', () => {
    const readings = generateDemoWellntelReadings(start, end)
    const cleaned = removeSpuriousReflections(readings, 0.25)

    const removed = readings.length - cleaned.length
    expect(removed).toBeGreaterThan(0)
    expect(Math.max(...readings.map((point) => point.value))).toBeGreaterThan(45)
    expect(Math.max(...cleaned.map((point) => point.value))).toBeLessThan(43.5)
    expect(Math.min(...cleaned.map((point) => point.value))).toBeGreaterThan(41.5)
  })
})
