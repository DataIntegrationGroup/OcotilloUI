import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const apiError = (status: number, data: unknown) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    { status, data } as AxiosResponse
  )

describe('getApiErrorMessage', () => {
  it('reports each pydantic issue with its field path', () => {
    const error = apiError(422, {
      detail: [
        {
          loc: ['body', 'deployment_id'],
          msg: '2 deployments cover 2026-01-01 to 2026-03-01 (4, 9); send deployment_id explicitly',
        },
        { loc: ['body', 'measurements', 3], msg: 'not strictly increasing' },
      ],
    })

    expect(getApiErrorMessage(error)).toBe(
      'deployment_id: 2 deployments cover 2026-01-01 to 2026-03-01 (4, 9); send deployment_id explicitly; measurements.3: not strictly increasing'
    )
  })

  it('uses a string detail as is', () => {
    expect(getApiErrorMessage(apiError(403, { detail: 'Forbidden' }))).toBe(
      'Forbidden'
    )
  })

  it('falls back to the error message when there is no detail', () => {
    expect(getApiErrorMessage(apiError(500, {}))).toBe(
      'Request failed with status code 500'
    )
    expect(getApiErrorMessage(new Error('No well is selected.'))).toBe(
      'No well is selected.'
    )
    expect(getApiErrorMessage('boom', 'Publishing failed.')).toBe(
      'Publishing failed.'
    )
  })
})
