import { describe, expect, it } from 'vitest'
import {
  compareToStandard,
  toDrinkingWaterStandards,
} from '@/constants/drinkingWaterStandards'
import { regulatoryLimit } from '../fixtures/regulatoryLimits'

describe('toDrinkingWaterStandards', () => {
  it('keys each MCL and SMCL by the parameter name results carry', () => {
    const standards = toDrinkingWaterStandards([
      regulatoryLimit('Arsenic', 'MCL', 0.01),
      regulatoryLimit('Iron', 'SMCL', 0.3),
    ])

    expect(standards.get('Arsenic')).toEqual({
      kind: 'MCL',
      limit: 0.01,
      unit: 'mg/L',
      source: 'EPA',
    })
    expect(standards.get('Iron')?.kind).toBe('SMCL')
  })

  it('leaves out limits that are not drinking water standards', () => {
    // A groundwater quality standard or a lab reporting limit printed as a
    // drinking water limit would misstate what the result is measured against.
    const standards = toDrinkingWaterStandards([
      regulatoryLimit('Arsenic', 'GWQS', 0.1, { limit_source: 'NMED' }),
      regulatoryLimit('Iron', 'PQL', 0.02),
      regulatoryLimit('Chloride', null, 250),
    ])

    expect(standards.size).toBe(0)
  })

  it('prefers the MCL when a parameter has both', () => {
    const smclFirst = toDrinkingWaterStandards([
      regulatoryLimit('Fluoride', 'SMCL', 2),
      regulatoryLimit('Fluoride', 'MCL', 4),
    ])
    const mclFirst = toDrinkingWaterStandards([
      regulatoryLimit('Fluoride', 'MCL', 4),
      regulatoryLimit('Fluoride', 'SMCL', 2),
    ])

    expect(smclFirst.get('Fluoride')).toMatchObject({ kind: 'MCL', limit: 4 })
    expect(mclFirst.get('Fluoride')).toMatchObject({ kind: 'MCL', limit: 4 })
  })

  it('compares against the limit the API served', () => {
    const standards = toDrinkingWaterStandards([
      regulatoryLimit('Arsenic', 'MCL', 0.005),
    ])

    // Above the API's value, below the old hard-coded 0.01.
    expect(compareToStandard(standards, 'Arsenic', 0.007, 'mg/L').exceeds).toBe(
      true
    )
  })
})
