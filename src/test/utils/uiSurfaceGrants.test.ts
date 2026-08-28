import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isGrantableAction,
  isUiSurfaceGranted,
  resetUiSurfaceGrants,
} from '@/utils/uiSurfaceGrants'

const { fetcherMock } = vi.hoisted(() => ({ fetcherMock: vi.fn() }))

vi.mock('@/providers/ocotillo-data-provider', () => ({
  fetcher: (...args: unknown[]) => fetcherMock(...args),
}))

const allowed = (value: boolean) => ({ data: { allowed: value } })

beforeEach(() => {
  fetcherMock.mockReset()
  resetUiSurfaceGrants()
})

describe('isUiSurfaceGranted', () => {
  it('asks the decision route about one surface, as read', async () => {
    fetcherMock.mockResolvedValue(allowed(true))

    await expect(isUiSurfaceGranted('ocotillo.lexicon')).resolves.toBe(true)
    expect(fetcherMock).toHaveBeenCalledWith('access/decision', {
      params: { capability: 'read', ui_surface: 'ocotillo.lexicon' },
    })
  })

  it('is false when no grant opens the surface', async () => {
    fetcherMock.mockResolvedValue(allowed(false))

    await expect(isUiSurfaceGranted('ocotillo.lexicon')).resolves.toBe(false)
  })

  it('denies by default when the call fails', async () => {
    fetcherMock.mockRejectedValue(new Error('network down'))

    await expect(isUiSurfaceGranted('ocotillo.lexicon')).resolves.toBe(false)
  })

  it('denies when the answer is not the shape it expects', async () => {
    fetcherMock.mockResolvedValue({ data: undefined })

    await expect(isUiSurfaceGranted('ocotillo.lexicon')).resolves.toBe(false)
  })

  it('caches a resolved answer for the session', async () => {
    fetcherMock.mockResolvedValue(allowed(true))

    await isUiSurfaceGranted('ocotillo.lexicon')
    await isUiSurfaceGranted('ocotillo.lexicon')

    expect(fetcherMock).toHaveBeenCalledTimes(1)
  })

  it('shares one request across a burst of callers', async () => {
    fetcherMock.mockResolvedValue(allowed(true))

    const answers = await Promise.all([
      isUiSurfaceGranted('ocotillo.lexicon'),
      isUiSurfaceGranted('ocotillo.lexicon'),
      isUiSurfaceGranted('ocotillo.lexicon'),
    ])

    expect(answers).toEqual([true, true, true])
    expect(fetcherMock).toHaveBeenCalledTimes(1)
  })

  it('keeps surfaces apart in the cache', async () => {
    fetcherMock.mockImplementation(
      (_url: string, config: { params: { ui_surface: string } }) =>
        Promise.resolve(
          allowed(config.params.ui_surface === 'ocotillo.lexicon')
        )
    )

    await expect(isUiSurfaceGranted('ocotillo.lexicon')).resolves.toBe(true)
    await expect(isUiSurfaceGranted('ocotillo.location')).resolves.toBe(false)
    expect(fetcherMock).toHaveBeenCalledTimes(2)
  })

  it('forgets everything on reset', async () => {
    fetcherMock.mockResolvedValue(allowed(true))

    await isUiSurfaceGranted('ocotillo.lexicon')
    resetUiSurfaceGrants()
    await isUiSurfaceGranted('ocotillo.lexicon')

    expect(fetcherMock).toHaveBeenCalledTimes(2)
  })
})

describe('isGrantableAction', () => {
  it('lets a surface grant widen reading', () => {
    expect(isGrantableAction('list')).toBe(true)
    expect(isGrantableAction('show')).toBe(true)
  })

  it('refuses to let seeing a screen become writing to it', () => {
    for (const action of ['create', 'edit', 'delete', 'manage']) {
      expect(isGrantableAction(action)).toBe(false)
    }
  })
})
