import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchDiverHubLocations,
  fetchDiverHubWaterLevels,
  toDepthToWaterPoints,
} from '@/providers/diverhub-data-provider'

const mockResponse = (body: unknown, ok = true, status = 200) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('diver-hub data provider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches locations and unwraps the response envelope', async () => {
    const fetchMock = mockResponse({
      status: 200,
      locations: [
        {
          projectName: 'NMBGMR',
          id: 4,
          name: 'DM-0107',
          isActive: true,
          monitoringPoints: [{ id: 11, name: 'Screen 1', isActive: true }],
        },
      ],
    })

    const locations = await fetchDiverHubLocations()

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://diver-hub.com/api/locations'
    )
    expect(locations).toHaveLength(1)
    expect(locations[0].name).toBe('DM-0107')
    expect(locations[0].monitoringPoints[0].id).toBe(11)
  })

  it('throws the envelope message on a non-200 envelope status', async () => {
    mockResponse({ status: 403, message: 'Forbidden project' })

    await expect(fetchDiverHubLocations('secret')).rejects.toThrow(
      'Forbidden project'
    )
  })

  it('passes the datetime range to the monitoring point endpoint', async () => {
    const fetchMock = mockResponse({ status: 200, approvedWaterLevelsGs: [] })

    await fetchDiverHubWaterLevels({
      projectName: 'NMBGMR',
      monitoringPointId: 11,
      fromDate: new Date('2025-01-15T00:00:00Z'),
      toDate: new Date('2025-04-15T00:00:00Z'),
    })

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('/monitoringPoint/NMBGMR/11')
    expect(url).toContain('fromDate=2025-01-15T00%3A00%3A00.000Z')
    expect(url).toContain('toDate=2025-04-15T00%3A00%3A00.000Z')
  })

  it('converts the gs frame to depth to water (negated, seconds epoch)', () => {
    const points = toDepthToWaterPoints({
      approvedGs: [
        { ts: 1736899200, gs: -42.1 }, // seconds epoch
        { ts: 1736920800000, gs: -42.2 }, // milliseconds epoch
      ],
      unApprovedGs: [{ ts: 1736942400, gs: -50 }],
      approvedVrd: [],
      unApprovedVrd: [],
      groundSurface: [],
    })

    expect(points.map((point) => point.value)).toEqual([42.1, 42.2])
    expect(points[0].time.getTime()).toBe(1736899200 * 1000)
    expect(points[1].time.getTime()).toBe(1736920800000)
  })

  it('includes unapproved readings only when asked', () => {
    const levels = {
      approvedGs: [{ ts: 1736899200, gs: -42.1 }],
      unApprovedGs: [{ ts: 1736942400, gs: -42.3 }],
      approvedVrd: [],
      unApprovedVrd: [],
      groundSurface: [],
    }

    expect(toDepthToWaterPoints(levels)).toHaveLength(1)
    expect(
      toDepthToWaterPoints(levels, { includeUnapproved: true })
    ).toHaveLength(2)
  })

  it('falls back to the vrd frame using the ground surface in effect', () => {
    const points = toDepthToWaterPoints({
      approvedGs: [],
      unApprovedGs: [],
      approvedVrd: [
        { ts: 1736899200, vrd: 1957.9 },
        { ts: 1767312000, vrd: 1957.2 }, // after the resurvey
      ],
      unApprovedVrd: [],
      groundSurface: [
        { fromDate: '2020-01-01T00:00:00Z', elevation: 2000.0 },
        { fromDate: '2025-06-01T00:00:00Z', elevation: 2000.5 },
      ],
    })

    // 2000.0 - 1957.9 before the resurvey, 2000.5 - 1957.2 after
    expect(points.map((point) => point.value)).toEqual([42.1, 43.3])
  })
})
