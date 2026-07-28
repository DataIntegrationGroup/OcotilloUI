import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { settings } from '@/settings'
import {
  buildWcsvFromReadings,
  fetchWellntelReadings,
  resolveWellntelPointId,
  toHydrographPoints,
  WELLNTEL_POINT_ID_MAP,
} from '@/providers/wellntel-data-provider'

const record = (timestamp: string, depth: number, wellname = 'Gaume Well') => ({
  wellname,
  timestamp,
  temperature: 708,
  depth,
})

const mockPages = (pages: unknown[][]) => {
  const fetchMock = vi.fn()
  pages.forEach((page) => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => page,
    })
  })
  // any further calls return an empty page
  fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('wellntel data provider', () => {
  beforeEach(() => {
    settings.wellntel.api_key = 'test-key'
  })

  afterEach(() => {
    settings.wellntel.api_key = ''
    vi.unstubAllGlobals()
  })

  it('maps wellnames to PointIDs using the wellpy map', () => {
    expect(WELLNTEL_POINT_ID_MAP['Gaume Well']).toBe('WL-0036')
    expect(resolveWellntelPointId('Eileen Dodds Well')).toBe('SA-0240')
    expect(resolveWellntelPointId('Unknown Well')).toBe('Unknown Well')
  })

  it('pages with an advancing cursor and dedupes the overlap', async () => {
    const fetchMock = mockPages([
      [record('2025-01-01 00:00:00', 42.0), record('2025-01-01 06:00:00', 42.1)],
      // cursor overlap: first record repeats the last of the prior page
      [record('2025-01-01 06:00:00', 42.1), record('2025-01-01 12:00:00', 42.2)],
      [record('2025-01-01 12:00:00', 42.2)], // cursor stops advancing
    ])

    const readings = await fetchWellntelReadings({
      start: new Date('2025-01-01 00:00:00'),
    })

    expect(readings.map((reading) => reading.depth)).toEqual([42.0, 42.1, 42.2])
    const firstUrl = String(fetchMock.mock.calls[0][0])
    expect(firstUrl).toContain('count=1000')
    expect(firstUrl).toContain('order=ascending')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      'Key test-key'
    )
    // URLSearchParams encodes the space in the cursor as '+'
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      'start=2025-01-01+06%3A00%3A00'
    )
  })

  it('converts raw temperature the way wellpy does and scopes by PointID and end bound', async () => {
    mockPages([
      [
        record('2025-01-01 00:00:00', 42.0),
        record('2025-01-01 06:00:00', 30.5, 'Eileen Dodds Well'),
        record('2025-01-02 00:00:00', 42.3),
      ],
    ])

    const readings = await fetchWellntelReadings({
      start: new Date('2025-01-01 00:00:00'),
      end: new Date('2025-01-01 12:00:00'),
      pointId: 'WL-0036',
    })

    expect(readings).toHaveLength(1)
    expect(readings[0].pointId).toBe('WL-0036')
    // wellpy: toc(708) = ((708 / 10) - 32) * 5 / 9
    expect(readings[0].temperatureC).toBeCloseTo(((708 / 10 - 32) * 5) / 9, 3)

    expect(toHydrographPoints(readings)).toEqual([
      { time: readings[0].timestamp, value: 42.0 },
    ])
  })

  it('throws without an API key', async () => {
    settings.wellntel.api_key = ''
    await expect(
      fetchWellntelReadings({ start: new Date('2025-01-01 00:00:00') })
    ).rejects.toThrow('No Wellntel API key')
  })

  it('builds the wellpy wcsv export shape', async () => {
    mockPages([[record('2025-01-01 00:00:00', 42.0)]])
    const readings = await fetchWellntelReadings({
      start: new Date('2025-01-01 00:00:00'),
    })

    const wcsv = buildWcsvFromReadings(readings)
    const [header, row] = wcsv.split('\n')
    expect(header).toBe('timestamp,temperature_C,temperature_raw,depth')
    expect(row).toContain('2025-01-01 00:00:00')
    expect(row).toContain('708')
    expect(row).toContain('42')
  })
})
