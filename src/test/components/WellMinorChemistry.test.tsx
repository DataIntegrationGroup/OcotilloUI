// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  MinorChemistryAccordion,
  matchesMinorChemistryFeatureToWell,
  normalizeMinorChemistrySummary,
} from '@/components/WellShow/MinorChemistry'

describe('minor chemistry helpers', () => {
  it('matches the flattened name field and does not rely on nested thing.name', () => {
    expect(
      matchesMinorChemistryFeatureToWell({
        feature: {
          properties: {
            name: 'Well A',
          },
        },
        wellName: 'Well A',
      })
    ).toBe(true)

    expect(
      matchesMinorChemistryFeatureToWell({
        feature: {
          properties: {
            thing: { name: 'Well A' },
          },
        },
        wellName: 'Well A',
      })
    ).toBe(false)
  })

  it('normalizes a single feature summary and renders missing analytes as N/A', () => {
    const summary = normalizeMinorChemistrySummary({
      feature: {
        id: 'latest',
        properties: {
          name: 'Well A',
          latest_chemistry_date: '2025-02-15T00:00:00Z',
          h2r: -90.4,
          c14: 73,
          c14_units: 'pmc',
          o18r: -12.7,
          fluoride: 0.8,
          fluoride_units: 'mg/L',
          arsenic: 0.004,
          arsenic_units: 'mg/L',
          nitrate_as_n: 1.2,
          nitrate_as_n_units: 'mg/L',
        },
      },
    })

    expect(summary?.h2r).toBe('-90.4')
    expect(summary?.c14).toBe('73 pmc')
    expect(summary?.o18r).toBe('-12.7')
    expect(summary?.fluoride).toBe('0.8 mg/L')
    expect(summary?.arsenic).toBe('0.004 mg/L')
    expect(summary?.nitrateAsN).toBe('1.2 mg/L')
    expect(summary?.bromide).toBe('N/A')
  })
})

describe('MinorChemistryAccordion', () => {
  it('shows the empty state when no summary exists', () => {
    render(<MinorChemistryAccordion summary={null} isLoading={false} />)

    expect(screen.getByText('No minor chemistry summary found.')).toBeTruthy()
  })
})
