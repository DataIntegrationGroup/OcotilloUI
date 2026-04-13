// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const goMock = vi.fn()
const useCanMock = vi.fn()
const useSearchMock = vi.fn()
const useDataProviderMock = vi.fn()
const notifyMock = vi.fn()

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useCan: () => useCanMock(),
    useGo: () => goMock,
    useDataProvider: () => useDataProviderMock(),
    useNotification: () => ({ open: notifyMock }),
  }
})

vi.mock('@/providers/search-provider', () => ({
  useSearch: () => useSearchMock(),
}))

import { Home } from '@/pages/home'

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('Home random well card', () => {
  beforeEach(() => {
    goMock.mockReset()
    useCanMock.mockReturnValue({ data: { can: true } })
    useSearchMock.mockReturnValue({ openSearch: vi.fn() })
    notifyMock.mockReset()
    useDataProviderMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('navigates to a random well show page when fetch succeeds', async () => {
    const getList = vi
      .fn()
      .mockResolvedValueOnce({ total: 3, data: [{ id: '1' }] })
      .mockResolvedValueOnce({ total: 3, data: [{ id: 'well-123' }] })

    useDataProviderMock.mockReturnValue(() => ({ getList }))
    vi.spyOn(Math, 'random').mockReturnValue(0.42)
    const user = userEvent.setup()

    render(<Home />)

    await user.click(screen.getByTestId('random-well-card'))

    await waitFor(() => {
      expect(goMock).toHaveBeenCalledWith({
        to: { resource: 'ocotillo.thing-well', action: 'show', id: 'well-123' },
      })
    })
    expect(getList).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        resource: 'thing/water-well',
        pagination: { currentPage: 1, pageSize: 1 },
      })
    )
    expect(getList).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        resource: 'thing/water-well',
        pagination: { currentPage: 2, pageSize: 1 },
      })
    )
  })

  it('falls back to the wells list when no wells are returned', async () => {
    const getList = vi.fn().mockResolvedValue({ total: 0, data: [] })
    useDataProviderMock.mockReturnValue(() => ({ getList }))
    const user = userEvent.setup()

    render(<Home />)

    await user.click(screen.getByTestId('random-well-card'))

    await waitFor(() => {
      expect(goMock).toHaveBeenCalledWith({
        to: '/ocotillo/well',
        type: 'push',
      })
    })
  })

  it('falls back to the wells list when fetch fails', async () => {
    const getList = vi.fn().mockRejectedValue(new Error('boom'))
    useDataProviderMock.mockReturnValue(() => ({ getList }))
    const user = userEvent.setup()

    render(<Home />)

    await user.click(screen.getByTestId('random-well-card'))

    await waitFor(() => {
      expect(goMock).toHaveBeenCalledWith({
        to: '/ocotillo/well',
        type: 'push',
      })
    })
    expect(notifyMock).toHaveBeenCalled()
  })

  it('ignores duplicate clicks while loading', async () => {
    const deferred = createDeferred<{
      total: number
      data: Array<{ id: string }>
    }>()
    const getList = vi.fn().mockReturnValueOnce(deferred.promise)
    useDataProviderMock.mockReturnValue(() => ({ getList }))
    const user = userEvent.setup()

    render(<Home />)

    const button = screen.getByTestId('random-well-card')
    await user.click(button)
    fireEvent.click(button)

    expect(getList).toHaveBeenCalledTimes(1)

    deferred.resolve({ total: 0, data: [] })
    await waitFor(() => {
      expect(goMock).toHaveBeenCalledWith({
        to: '/ocotillo/well',
        type: 'push',
      })
    })
  })
})
