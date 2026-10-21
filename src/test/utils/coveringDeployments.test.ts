import { describe, expect, it } from 'vitest'
import { findCoveringDeployments } from '@/utils/coveringDeployments'
import type { DeploymentLike } from '@/utils/SensorDeploymentRows'

const deployment = (
  id: DeploymentLike['id'],
  installation_date: string | null,
  removal_date: string | null
): DeploymentLike => ({ id, installation_date, removal_date })

const span = (start: string, end: string) =>
  [new Date(start), new Date(end)] as const

describe('findCoveringDeployments', () => {
  it('returns every deployment whose period covers the span', () => {
    // SA-0231 in BDMS-1294: two open deployments both cover the file.
    const covering = findCoveringDeployments(
      [
        deployment(325, '2023-06-01', null),
        deployment(326, null, null),
        deployment(100, '2020-01-01', '2023-01-01'),
      ],
      ...span('2024-02-20T15:00:00Z', '2025-02-11T18:00:00Z')
    )

    expect(covering.map((d) => d.id)).toEqual([325, 326])
  })

  it('treats the boundary dates as covered', () => {
    expect(
      findCoveringDeployments(
        [deployment(1, '2024-02-20', '2025-02-11')],
        ...span('2024-02-20T00:00:00Z', '2025-02-11T23:59:00Z')
      ).map((d) => d.id)
    ).toEqual([1])
  })

  it('excludes deployments installed after the span starts or removed before it ends', () => {
    expect(
      findCoveringDeployments(
        [deployment(1, '2024-03-01', null), deployment(2, null, '2025-01-01')],
        ...span('2024-02-20T00:00:00Z', '2025-02-11T00:00:00Z')
      )
    ).toEqual([])
  })

  it('compares full datetimes by their date and skips unattached sensor rows', () => {
    expect(
      findCoveringDeployments(
        [
          deployment(7, '2024-02-20T09:30:00Z', null),
          deployment('sensor-9', null, null),
        ],
        ...span('2024-02-20T08:00:00Z', '2024-03-01T00:00:00Z')
      ).map((d) => d.id)
    ).toEqual([7])
  })
})
