// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  buildSampleMaps,
  fetchSampleMaps,
  latestSampleIds,
  useSampleMaps,
} from '../../pages/ocotillo/thing/useSampleMaps'

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

describe('fetchSampleMaps / buildSampleMaps (FCN Last Measurements · Method / Staff)', () => {
  it('fetches the samples behind the two newest readings and maps method + staff', async () => {
    const samples: Record<number, any> = {
      7: { sample_method: 'Electric tape', sampler_name: 'EM', contact: { name: 'Ethan Mamer' } },
      6: { sample_method: 'Steel tape', sampler_name: 'Jordan Tate' },
      5: { sample_method: 'Old', sampler_name: 'Old' },
    }
    const getOne = vi.fn(async ({ id }: { resource: string; id: number }) => ({ data: samples[id] }))

    const maps = await fetchSampleMaps({ getOne }, [
      { observation_datetime: '2024-01-01T00:00:00Z', sample_id: 5 },
      { observation_datetime: '2026-10-21T00:00:00Z', sample_id: 7 },
      { observation_datetime: '2026-04-14T00:00:00Z', sample_id: 6 },
    ])

    expect(getOne.mock.calls.map(([p]) => p)).toEqual([
      { resource: 'ocotillo.sample', id: 7 },
      { resource: 'ocotillo.sample', id: 6 },
    ])
    expect(maps.sampleMethodsBySampleId).toEqual({ 7: 'Electric tape', 6: 'Steel tape' })
    // contact full name wins over sampler_name initials; sampler_name is the fallback
    expect(maps.staffBySampleId).toEqual({ 7: 'Ethan Mamer', 6: 'Jordan Tate' })
  })

  it('skips failed fetches and falls back to field-event participants for staff', async () => {
    const getOne = vi.fn(async ({ id }: { resource: string; id: number }) => {
      if (id === 2) throw new Error('boom')
      return {
        data: {
          sample_method: '',
          field_event: { field_event_participants: [{ participant: { name: 'A B' } }] },
        },
      }
    })
    const maps = await fetchSampleMaps({ getOne }, [
      { observation_datetime: '2026-01-02T00:00:00Z', sample_id: 1 },
      { observation_datetime: '2026-01-01T00:00:00Z', sample_id: 2 },
    ])
    expect(maps.sampleMethodsBySampleId).toEqual({ 1: '-' })
    expect(maps.staffBySampleId).toEqual({ 1: 'A B' })
  })

  it('latestSampleIds ignores readings without a sample', () => {
    expect(
      latestSampleIds([
        { observation_datetime: '2026-01-03T00:00:00Z' },
        { observation_datetime: '2026-01-02T00:00:00Z', sample_id: 9 },
        { observation_datetime: '2026-01-01T00:00:00Z', sample_id: 8 },
      ])
    ).toEqual([9])
    expect(buildSampleMaps([]).staffBySampleId).toEqual({})
  })
})
