// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  MajorChemistryAccordion,
  matchesMajorChemistryFeatureToWell,
  normalizeMajorChemistrySummary,
} from '@/components/WellShow/MajorChemistry'

describe('major chemistry helpers', () => {
  it('matches the flattened name field and does not rely on thing_name or nested thing.name', () => {
    expect(
      matchesMajorChemistryFeatureToWell({
        feature: {
          properties: {
            name: 'Well A',
          },
        },
        wellName: 'Well A',
      })
    ).toBe(true)

    expect(
      matchesMajorChemistryFeatureToWell({
        feature: {
          properties: {
            thing_name: 'Well A',
          },
        },
        wellName: 'Well A',
      })
    ).toBe(false)

    expect(
      matchesMajorChemistryFeatureToWell({
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
    const summary = normalizeMajorChemistrySummary({
      feature: {
        id: 'latest',
        properties: {
          name: 'Well A',
          latest_chemistry_date: '2025-02-15T00:00:00Z',
          tds: 250,
          tds_units: 'mg/L',
          calcium: 10,
          calcium_units: 'mg/L',
        },
      },
    })

    expect(summary?.tds).toBe('250 mg/L')
    expect(summary?.calcium).toBe('10 mg/L')
    expect(summary?.magnesium).toBe('N/A')
  })
})

describe('MajorChemistryAccordion', () => {
  it('shows the empty state when no summary exists', () => {
    render(<MajorChemistryAccordion summary={null} isLoading={false} />)

    expect(screen.getByText('No major chemistry summary found.')).toBeTruthy()
  })
})
