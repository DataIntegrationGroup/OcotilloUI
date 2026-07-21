import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/settings', () => ({
  settings: { nmbgmr_geothermal_api_url: 'https://geo.test' },
}))
vi.mock('@/providers/authentik-provider', () => ({
  getAccessToken: vi.fn(async () => 'test-token'),
}))

import { geothermalDataProvider } from '@/providers/geothermal-data-provider'

// Minimal Response stand-in — the provider only reads status + json().
const resp = (status: number, body: unknown) =>
  ({ status, json: async () => body }) as unknown as Response

const stubFetch = (r: Response) => {
  const fn = vi.fn(async () => r)
  vi.stubGlobal('fetch', fn)
  return fn
}

const validation422 = {
  detail: [
    { loc: ['body', 'WellName'], msg: 'field required' },
    { loc: ['body', 'WellNumber'], msg: 'value is not a valid integer' },
  ],
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('geothermal provider write error mapping', () => {
  it('update maps a 422 Pydantic payload to fieldErrors (body. stripped)', async () => {
    stubFetch(resp(422, validation422))

    const err = await geothermalDataProvider
      .update!({ resource: 'wells/1/records', id: 5, variables: {} })
      .then(() => null)
      .catch((e) => e)

    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Validation Error')
    expect(err.status).toBe(422)
    expect(err.fieldErrors).toEqual({
      WellName: ['field required'],
      WellNumber: ['value is not a valid integer'],
    })
    // Refine also reads `.errors`.
    expect(err.errors).toEqual(err.fieldErrors)
  })

  it('create maps a 409 conflict payload to fieldErrors', async () => {
    stubFetch(resp(409, { detail: [{ loc: ['body', 'WellDataID'], msg: 'exists' }] }))

    const err = await geothermalDataProvider
      .create!({ resource: 'wells/1/records', variables: { WellDataID: 'x' } })
      .then(() => null)
      .catch((e) => e)

    expect(err.status).toBe(409)
    expect(err.fieldErrors).toEqual({ WellDataID: ['exists'] })
  })

  it('throws the raw response for a non-validation error status', async () => {
    const r = resp(500, { detail: 'boom' })
    stubFetch(r)

    const err = await geothermalDataProvider
      .update!({ resource: 'wells/1/records', id: 5, variables: {} })
      .then(() => null)
      .catch((e) => e)

    expect(err).toBe(r)
    expect(err).not.toBeInstanceOf(Error)
  })

  it('throws the raw response for a 422 without a detail array', async () => {
    const r = resp(422, { message: 'nope' })
    stubFetch(r)

    const err = await geothermalDataProvider
      .create!({ resource: 'wells/1/records', variables: {} })
      .then(() => null)
      .catch((e) => e)

    expect(err).toBe(r)
  })

  it('returns { data } on a successful create', async () => {
    const created = { OBJECTID: 99, WellName: 'New' }
    stubFetch(resp(201, created))

    const result = await geothermalDataProvider.create!({
      resource: 'wells/1/records',
      variables: { WellName: 'New' },
    })

    expect(result).toEqual({ data: created })
  })
})
