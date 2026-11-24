// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSampleMaps } from '../../pages/ocotillo/thing/useSampleMaps'

describe('useSampleMaps', () => {
  const mockDataProvider = vi.fn()

  it('resolves exactly 2 fetches for 3 wells sharing 2 sample ids', async () => {
    const mockSamples: Record<number, any> = {
      101: { sample_method: 'Method A', sampler_name: 'Staff A' },
      102: { sample_method: 'Method B', sampler_name: 'Staff B' },
    }

    mockDataProvider.mockImplementation((resource) => ({
      getOne: vi.fn().mockImplementation((params: any) => {
        const id = params.id
        return Promise.resolve({
          data: mockSamples[id],
        })
      }),
    }))

    const { result } = renderHook(() => useSampleMaps(mockDataProvider))

    const observations: any[] = [
      { sample_id: 101 },
      { sample_id: 102 },
      { sample_id: 101 },
    ]

    const { sampleMethodsBySampleId, staffBySampleId } = await result.current.getSampleMaps(observations)

    expect(mockDataProvider.mock.calls.filter(call => call[0] === 'ocotillo').length).toBe(2)
    expect(sampleMethodsBySampleId[101]).toBe('Method A')
    expect(sampleMethodsBySampleId[102]).toBe('Method B')
    expect(staffBySampleId[101]).toBe('Staff A')
    expect(staffBySampleId[102]).toBe('Staff B')
  })

  it('clears cache on rejection so a retry refetches', async () => {
    let fetchCount = 0
    mockDataProvider.mockImplementation((resource) => ({
      getOne: vi.fn().mockImplementation((params: any) => {
        fetchCount++
        if (fetchCount === 1) {
          return Promise.reject(new Error('Failed'))
        }
        return Promise.resolve({
          data: { sample_method: 'Success', sampler_name: 'Staff' },
        })
      }),
    }))

    const { result } = renderHook(() => useSampleMaps(mockDataProvider))
    const observations: any[] = [{ sample_id: 999 }]

    // First attempt fails: a rejected sample is dropped, not thrown — the sheet still renders.
    const first = await result.current.getSampleMaps(observations)
    expect(fetchCount).toBe(1)
    expect(first.sampleMethodsBySampleId).toEqual({})

    // Second attempt refetches (the failure was not pinned to the cache).
    const { sampleMethodsBySampleId } = await result.current.getSampleMaps(observations)
    expect(fetchCount).toBe(2)
    expect(sampleMethodsBySampleId[999]).toBe('Success')
  })

  it('returns correct maps for multiple sample ids', async () => {
    const mockSamples: Record<number, any> = {
      1: { sample_method: 'M1', sampler_name: 'S1' },
      2: { sample_method: 'M2', sampler_name: 'S2' },
    }

    mockDataProvider.mockImplementation((resource) => ({
      getOne: vi.fn().mockImplementation((params: any) =>
        Promise.resolve({ data: mockSamples[params.id] }),
      ),
    }))

    const { result } = renderHook(() => useSampleMaps(mockDataProvider))
    const { sampleMethodsBySampleId, staffBySampleId } = await result.current.getSampleMaps([
      { sample_id: 1 },
      { sample_id: 2 },
    ])

    expect(sampleMethodsBySampleId).toEqual({ 1: 'M1', 2: 'M2' })
    expect(staffBySampleId).toEqual({ 1: 'S1', 2: 'S2' })
  })
})
