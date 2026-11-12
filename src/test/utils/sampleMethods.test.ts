import { describe, expect, it } from 'vitest'
import { sampleMethodsBySampleId } from '@/utils/sampleMethods'

describe('sampleMethodsBySampleId', () => {
  it('returns {} when there is no sample', () => {
    expect(sampleMethodsBySampleId()).toEqual({})
    expect(sampleMethodsBySampleId(undefined)).toEqual({})
  })

  it('returns {} when the sample has no usable method', () => {
    expect(sampleMethodsBySampleId({ id: 7, sample_method: null })).toEqual({})
  })

  it('keys a non-blank method by its id', () => {
    expect(
      sampleMethodsBySampleId({ id: 7, sample_method: 'Steel tape' })
    ).toEqual({ 7: 'Steel tape' })
  })
})
