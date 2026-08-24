import { describe, expect, it } from 'vitest'
import {
  MAP_DEFAULT_LAYER_COLOR,
  MAP_HIGHLIGHT_COLOR,
  MAP_LAYER_COLORS,
  MAP_NO_DATA_COLOR,
} from '@/constants/mapColors'
import {
  VIRIDIS_ANCHORS,
  VIRIDIS_HIGH,
  VIRIDIS_LOW,
  VIRIDIS_MID,
  viridisColor,
  viridisGradient,
  viridisSamples,
} from '@/constants/viridis'

const HEX = /^#[0-9a-f]{6}$/

const DENSE_RAMP = viridisSamples(1001)

const rgb = (hex: string): [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]

/** Largest per-channel gap between `hex` and the nearest color on the ramp. */
const distanceToRamp = (hex: string): number => {
  const [r, g, b] = rgb(hex)
  return DENSE_RAMP.reduce((best, sample) => {
    const [sr, sg, sb] = rgb(sample)
    const gap = Math.max(Math.abs(r - sr), Math.abs(g - sg), Math.abs(b - sb))
    return Math.min(best, gap)
  }, Number.POSITIVE_INFINITY)
}

const relativeLuminance = (hex: string): number => {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

describe('viridisColor', () => {
  it('returns the ramp endpoints at 0 and 1', () => {
    expect(viridisColor(0)).toBe('#440154')
    expect(viridisColor(1)).toBe('#fde725')
  })

  it('returns an anchor exactly when the position lands on one', () => {
    VIRIDIS_ANCHORS.forEach((anchor, index) => {
      expect(viridisColor(index / (VIRIDIS_ANCHORS.length - 1))).toBe(anchor)
    })
  })

  it('interpolates between anchors', () => {
    // Halfway between #440154 and #482878.
    expect(viridisColor(0.5 / (VIRIDIS_ANCHORS.length - 1))).toBe('#461566')
  })

  it('clamps out-of-range positions to the nearer end', () => {
    expect(viridisColor(-3)).toBe(VIRIDIS_LOW)
    expect(viridisColor(42)).toBe(VIRIDIS_HIGH)
    expect(viridisColor(Number.NEGATIVE_INFINITY)).toBe(VIRIDIS_LOW)
    expect(viridisColor(Number.POSITIVE_INFINITY)).toBe(VIRIDIS_HIGH)
  })

  it('maps NaN to the dark end rather than throwing', () => {
    expect(viridisColor(Number.NaN)).toBe(VIRIDIS_LOW)
  })

  it('always produces a six-digit lowercase hex color', () => {
    for (let step = 0; step <= 100; step += 1) {
      expect(viridisColor(step / 100)).toMatch(HEX)
    }
  })

  it('increases monotonically in luminance from the dark to the light end', () => {
    const luminances = viridisSamples(20).map(relativeLuminance)
    for (let index = 1; index < luminances.length; index += 1) {
      expect(luminances[index]).toBeGreaterThan(luminances[index - 1])
    }
  })
})

describe('viridisSamples', () => {
  it('returns an empty list for non-positive counts', () => {
    expect(viridisSamples(0)).toEqual([])
    expect(viridisSamples(-1)).toEqual([])
  })

  it('returns the ramp midpoint for a single sample', () => {
    expect(viridisSamples(1)).toEqual([VIRIDIS_MID])
  })

  it('includes both endpoints and stays distinct for typical class counts', () => {
    for (const count of [3, 6, 7]) {
      const samples = viridisSamples(count)
      expect(samples).toHaveLength(count)
      expect(samples[0]).toBe(VIRIDIS_LOW)
      expect(samples[count - 1]).toBe(VIRIDIS_HIGH)
      expect(new Set(samples).size).toBe(count)
    }
  })
})

describe('viridisGradient', () => {
  it('spans 0% to 100% across the ramp', () => {
    const gradient = viridisGradient(3)
    expect(gradient).toBe(
      `linear-gradient(90deg, ${VIRIDIS_LOW} 0%, ${VIRIDIS_MID} 50%, ${VIRIDIS_HIGH} 100%)`
    )
  })

  it('never emits fewer than two stops', () => {
    expect(viridisGradient(1)).toBe(
      `linear-gradient(90deg, ${VIRIDIS_LOW} 0%, ${VIRIDIS_HIGH} 100%)`
    )
  })

  it('accepts a custom angle', () => {
    expect(viridisGradient(2, '180deg')).toContain('linear-gradient(180deg,')
  })
})

describe('map layer colors', () => {
  it('gives every layer a distinct viridis color', () => {
    const colors = Object.values(MAP_LAYER_COLORS)
    expect(colors.length).toBeGreaterThan(0)
    colors.forEach((color) => expect(color).toMatch(HEX))
    expect(new Set(colors).size).toBe(colors.length)
  })

  it('draws every layer color from the viridis ramp', () => {
    Object.values(MAP_LAYER_COLORS).forEach((color) => {
      expect(distanceToRamp(color)).toBeLessThanOrEqual(1)
    })
  })

  it('keeps the no-data color off the ramp so it cannot read as a class', () => {
    expect(distanceToRamp(MAP_NO_DATA_COLOR)).toBeGreaterThan(8)
  })

  it('spaces layer colors apart instead of clustering them', () => {
    const colors = Object.values(MAP_LAYER_COLORS)
    let closest = Number.POSITIVE_INFINITY
    for (let i = 0; i < colors.length; i += 1) {
      for (let j = i + 1; j < colors.length; j += 1) {
        const [r1, g1, b1] = rgb(colors[i])
        const [r2, g2, b2] = rgb(colors[j])
        closest = Math.min(
          closest,
          Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2), Math.abs(b1 - b2))
        )
      }
    }
    // Guards against a future layer being squeezed in next to an existing one:
    // no two layer colors may sit within 8/255 on every channel.
    expect(closest).toBeGreaterThanOrEqual(8)
  })

  it('highlights with the light end of the ramp for maximum contrast', () => {
    expect(MAP_HIGHLIGHT_COLOR).toBe(VIRIDIS_HIGH)
    expect(MAP_DEFAULT_LAYER_COLOR).toBe(VIRIDIS_MID)
  })
})
