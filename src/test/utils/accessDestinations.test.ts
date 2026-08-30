import { describe, expect, it } from 'vitest'
import {
  type Destination,
  destinationLabel,
  indexDestinationsById,
  sortDestinations,
  toCreateDestinationInput,
  validateDestinationForm,
  zDestination,
} from '@/utils/accessDestinations'

const destination = (overrides: Partial<Destination> = {}): Destination =>
  zDestination.parse({
    id: 1,
    slug: 'ngwmn',
    name: 'National Ground-Water Monitoring Network',
    destination_kind: 'harvester',
    description: null,
    active: true,
    ...overrides,
  })

describe('validateDestinationForm', () => {
  const form = { slug: 'ngwmn', name: 'NGWMN' }

  it('accepts a well-formed destination', () => {
    expect(validateDestinationForm(form)).toEqual({})
  })

  it('requires a slug and a name', () => {
    expect(validateDestinationForm({ slug: '  ', name: 'x' })).toHaveProperty(
      'slug'
    )
    expect(validateDestinationForm({ slug: 'x', name: '  ' })).toHaveProperty(
      'name'
    )
  })

  it('rejects a slug that would not survive a URL path', () => {
    expect(
      validateDestinationForm({ ...form, slug: 'NG WMN/x' })
    ).toHaveProperty('slug')
  })

  it('accepts hyphens and underscores in a slug', () => {
    expect(
      validateDestinationForm({ ...form, slug: 'partner_agency-2' })
    ).toEqual({})
  })

  it('enforces the API length caps', () => {
    expect(
      validateDestinationForm({ ...form, slug: 'a'.repeat(51) })
    ).toHaveProperty('slug')
    expect(
      validateDestinationForm({ ...form, name: 'a'.repeat(256) })
    ).toHaveProperty('name')
  })
})

describe('toCreateDestinationInput', () => {
  it('trims and sends null rather than an empty description', () => {
    expect(
      toCreateDestinationInput({
        slug: '  ngwmn  ',
        name: '  NGWMN  ',
        destination_kind: 'harvester',
        description: '   ',
      })
    ).toEqual({
      slug: 'ngwmn',
      name: 'NGWMN',
      destination_kind: 'harvester',
      description: null,
    })
  })
})

describe('sortDestinations', () => {
  it('puts active destinations before retired ones, then sorts by slug', () => {
    const rows = sortDestinations([
      destination({ id: 1, slug: 'zeta', active: true }),
      destination({ id: 2, slug: 'alpha', active: false }),
      destination({ id: 3, slug: 'beta', active: true }),
    ])

    expect(rows.map((row) => row.slug)).toEqual(['beta', 'zeta', 'alpha'])
  })
})

describe('indexDestinationsById', () => {
  it('resolves the id a consent row carries', () => {
    const index = indexDestinationsById([destination({ id: 7 })])

    expect(index.get(7)?.slug).toBe('ngwmn')
    expect(index.get(99)).toBeUndefined()
  })

  it('tolerates a list that has not loaded', () => {
    expect(indexDestinationsById(undefined).size).toBe(0)
  })
})

describe('destinationLabel', () => {
  it('names the destination and its slug', () => {
    expect(destinationLabel(destination())).toBe(
      'National Ground-Water Monitoring Network (ngwmn)'
    )
  })
})
