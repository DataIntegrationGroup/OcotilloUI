import { describe, expect, it } from 'vitest'
import { getFeatureId } from '@/utils/mapSelection'

// This test guards the selection/highlight contract: PiperDiagram should use the
// same ID resolution helper as the map selection flow.

describe('getFeatureId', () => {
  it('uses properties.feature_id when present', () => {
    const feature: any = {
      type: 'Feature',
      properties: {
        feature_id: 'abc-123',
      },
    }

    expect(getFeatureId(feature)).toBe('abc-123')
  })
})

