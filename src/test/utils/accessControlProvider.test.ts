import { afterEach, describe, expect, it, vi } from 'vitest'
import { accessControlProvider } from '@/providers/access-control-provider'
import { getAccessControlGroups } from '@/providers/authentik-provider'

const mockedGetAccessControlGroups = vi.mocked(getAccessControlGroups)

describe('accessControlProvider', () => {
  afterEach(() => {
    mockedGetAccessControlGroups.mockReset()
  })

  it('delegates resource and action checks to the ACL function', async () => {
    mockedGetAccessControlGroups.mockReturnValue(['AMP.Editor'])

    await expect(
      accessControlProvider.can({
        resource: 'ocotillo.lexicon',
        action: 'show',
      })
    ).resolves.toEqual({ can: true })

    await expect(
      accessControlProvider.can({
        resource: 'ocotillo.lexicon',
        action: 'create',
      })
    ).resolves.toEqual({ can: false })
  })

  it('uses params.resource.meta.wip to gate unfinished resources', async () => {
    mockedGetAccessControlGroups.mockReturnValue(['AMP.Editor'])

    await expect(
      accessControlProvider.can({
        resource: 'ocotillo.map',
        action: 'list',
      })
    ).resolves.toEqual({ can: true })

    await expect(
      accessControlProvider.can({
        resource: 'ocotillo.map',
        action: 'list',
        params: { resource: { meta: { wip: true } } },
      })
    ).resolves.toEqual({ can: false })
  })

  it('allows AMP admins to pass WIP gating from meta', async () => {
    mockedGetAccessControlGroups.mockReturnValue(['AMP.Admin'])

    await expect(
      accessControlProvider.can({
        resource: 'ocotillo.map',
        action: 'list',
        params: { resource: { meta: { wip: true } } },
      })
    ).resolves.toEqual({ can: true })
  })
})
