import { describe, expect, it } from 'vitest'
import { PRIMARY_NAV, RESOURCE_NAV } from '@/config/navigation'

describe('HydroSync navigation', () => {
  it('labels the hydrograph correction tool HydroSync', () => {
    const item = [...PRIMARY_NAV, ...RESOURCE_NAV].find(
      (entry) => entry.resource === 'ocotillo.hydrograph-correction'
    )

    expect(item?.label).toBe('HydroSync')
    expect(item?.href).toBe('/ocotillo/hydrograph-correction')
  })
})
