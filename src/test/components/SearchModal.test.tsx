// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchModal } from '@/components/SearchModal'

const { useAbortableListMock, useSearchHistoryMock } = vi.hoisted(() => ({
  useAbortableListMock: vi.fn(),
  useSearchHistoryMock: vi.fn(),
}))

vi.mock('@refinedev/core', async () => {
  return {
    useGo: () => vi.fn(),
  }
})

vi.mock('@/hooks', () => {
  return {
    useDebounce: (value: string) => value,
    useAbortableList: (...args: unknown[]) => useAbortableListMock(...args),
    useSearchHistory: () => useSearchHistoryMock(),
  }
})

describe('SearchModal arcade easter eggs', () => {
  beforeEach(() => {
    useAbortableListMock.mockReset()
    useSearchHistoryMock.mockReset()
    useSearchHistoryMock.mockReturnValue({
      get: () => [],
      add: vi.fn(),
      clear: vi.fn(),
    })
    useAbortableListMock.mockReturnValue({
      query: {
        isFetching: false,
        isError: false,
      },
      result: { data: [] },
    })
  })

  it('opens the Snake game when the query is snake', async () => {
    const user = userEvent.setup()

    render(<SearchModal open={true} onClose={vi.fn()} />)

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'snake')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Snake' })).toBeTruthy()
    })

    expect(screen.getByText('Score: 0')).toBeTruthy()
    expect(screen.getByRole('grid', { name: 'Snake game board' })).toBeTruthy()
  })

  it('opens the Asteroids game when the query is asteroids', async () => {
    const user = userEvent.setup()

    render(<SearchModal open={true} onClose={vi.fn()} />)

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'asteroids')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Asteroids' })).toBeTruthy()
    })

    expect(screen.getByText('Score: 0')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Asteroids game board' })).toBeTruthy()
  })

  it('opens the Race Car game when the query is racecar', async () => {
    const user = userEvent.setup()

    render(<SearchModal open={true} onClose={vi.fn()} />)

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'racecar')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Race Car' })).toBeTruthy()
    })

    expect(screen.getByText('Distance: 0 m')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Race car game board' })).toBeTruthy()
  })

  it('opens the Tetris game when the query is tetris', async () => {
    const user = userEvent.setup()

    render(<SearchModal open={true} onClose={vi.fn()} />)

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'tetris')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Tetris' })).toBeTruthy()
    })

    expect(screen.getByText('Score: 0')).toBeTruthy()
    expect(screen.getByText('Lines: 0')).toBeTruthy()
    expect(screen.getByRole('grid', { name: 'Tetris game board' })).toBeTruthy()
  })
})
