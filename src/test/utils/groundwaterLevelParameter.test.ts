import { describe, expect, it } from 'vitest'
import type { IParameterSummary } from '@/interfaces/ocotillo/IObservation'
import { findGroundwaterLevelParameterId } from '@/utils/groundwaterLevelParameter'

const parameter = (
  overrides: Partial<IParameterSummary>
): IParameterSummary => ({
  id: 1,
  parameter_name: 'groundwater level',
  parameter_type: 'Field Parameter',
  matrix: 'water',
  default_unit: 'ft',
  cas_number: null,
  release_status: 'public',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

const transducerRow = (parameterId: number) =>
  ({ block: { parameter_id: parameterId } }) as never

describe('findGroundwaterLevelParameterId', () => {
  it('prefers the parameter id on stored transducer blocks', () => {
    expect(
      findGroundwaterLevelParameterId({
        transducerRows: [transducerRow(42)],
        manualRows: [{ parameter: parameter({ id: 7 }) }],
      })
    ).toBe(42)
  })

  it('falls back to the groundwater level parameter on manual readings', () => {
    expect(
      findGroundwaterLevelParameterId({
        manualRows: [
          { parameter: undefined },
          { parameter: parameter({ id: 3, parameter_name: 'temperature' }) },
          { parameter: parameter({ id: 7 }) },
        ],
      })
    ).toBe(7)
  })

  it('returns null when no row carries the parameter', () => {
    expect(findGroundwaterLevelParameterId({})).toBeNull()
    expect(
      findGroundwaterLevelParameterId({
        manualRows: [
          { parameter: parameter({ id: 3, parameter_name: 'temperature' }) },
        ],
      })
    ).toBeNull()
  })
})
