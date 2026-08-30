import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accessControlProvider } from '@/providers/access-control-provider'

const { getGroupsMock, canAccessResourceMock, isUiSurfaceGrantedMock } =
  vi.hoisted(() => ({
    getGroupsMock: vi.fn(),
    canAccessResourceMock: vi.fn(),
    isUiSurfaceGrantedMock: vi.fn(),
  }))

vi.mock('@/providers/authentik-provider', () => ({
  getAccessControlGroups: () => getGroupsMock(),
}))

vi.mock('@/utils', () => ({
  canAccessResource: (...args: unknown[]) => canAccessResourceMock(...args),
}))

vi.mock('@/utils/uiSurfaceGrants', async () => {
  const actual = await vi.importActual<
    typeof import('@/utils/uiSurfaceGrants')
  >('@/utils/uiSurfaceGrants')

  return {
    ...actual,
    isUiSurfaceGranted: (...args: unknown[]) => isUiSurfaceGrantedMock(...args),
  }
})

const can = (action: string, resource = 'ocotillo.lexicon', params?: unknown) =>
  accessControlProvider.can({ resource, action, params })

beforeEach(() => {
  getGroupsMock.mockReset().mockReturnValue(['AMP.Viewer'])
  canAccessResourceMock.mockReset().mockReturnValue(false)
  isUiSurfaceGrantedMock.mockReset().mockResolvedValue(false)
})

describe('accessControlProvider — role policy is the floor', () => {
  it('allows what the role allows without asking about grants', async () => {
    canAccessResourceMock.mockReturnValue(true)

    await expect(can('list')).resolves.toEqual({ can: true })
    expect(isUiSurfaceGrantedMock).not.toHaveBeenCalled()
  })

  it('cannot subtract: a denied grant never overrides an allowing role', async () => {
    canAccessResourceMock.mockReturnValue(true)
    isUiSurfaceGrantedMock.mockResolvedValue(false)

    await expect(can('list')).resolves.toEqual({ can: true })
  })
})

describe('accessControlProvider — grants widen', () => {
  it('opens a screen the role denied when a grant names it', async () => {
    isUiSurfaceGrantedMock.mockResolvedValue(true)

    await expect(can('list')).resolves.toEqual({ can: true })
    expect(isUiSurfaceGrantedMock).toHaveBeenCalledWith('ocotillo.lexicon')
  })

  it('stays denied when no grant names the screen', async () => {
    await expect(can('list')).resolves.toEqual({ can: false })
  })

  it('leaves the role decision standing when the grant lookup fails', async () => {
    isUiSurfaceGrantedMock.mockResolvedValue(false)

    await expect(can('show')).resolves.toEqual({ can: false })
  })
})

describe('accessControlProvider — what a surface grant may not do', () => {
  it.each(['create', 'edit', 'delete', 'manage'])(
    'does not let seeing a screen confer %s',
    async (action) => {
      isUiSurfaceGrantedMock.mockResolvedValue(true)

      await expect(can(action)).resolves.toEqual({ can: false })
      expect(isUiSurfaceGrantedMock).not.toHaveBeenCalled()
    }
  )

  it('does not reveal a WIP surface, which is hidden for a different reason', async () => {
    isUiSurfaceGrantedMock.mockResolvedValue(true)

    const result = await can('list', 'water.dashboard', {
      resource: { meta: { wip: true } },
    })

    expect(result).toEqual({ can: false })
    expect(isUiSurfaceGrantedMock).not.toHaveBeenCalled()
  })

  it('asks nothing when there is no resource to name', async () => {
    await expect(
      accessControlProvider.can({ action: 'list' })
    ).resolves.toEqual({ can: false })
    expect(isUiSurfaceGrantedMock).not.toHaveBeenCalled()
  })
})
