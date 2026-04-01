// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchModal } from '@/components/SearchModal'

const {
  goMock,
  searchDocsMock,
  useAbortableListMock,
  useSearchHistoryMock,
} = vi.hoisted(() => ({
  goMock: vi.fn(),
  searchDocsMock: vi.fn(),
  useAbortableListMock: vi.fn(),
  useSearchHistoryMock: vi.fn(),
}))

vi.mock('@refinedev/core', async () => {
  return {
    useGo: () => goMock,
  }
})

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

vi.mock('@/hooks/useAbortableList', () => ({
  useAbortableList: (...args: unknown[]) => useAbortableListMock(...args),
}))

vi.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => useSearchHistoryMock(),
}))

vi.mock('@/utils/docsSearch', () => {
  return {
    searchDocs: (...args: unknown[]) => searchDocsMock(...args),
  }
})

describe('SearchModal arcade easter eggs', () => {
  beforeEach(() => {
    goMock.mockReset()
    searchDocsMock.mockReset()
    useAbortableListMock.mockReset()
    useSearchHistoryMock.mockReset()
    useSearchHistoryMock.mockReturnValue({
      get: () => [],
      add: vi.fn(),
      clear: vi.fn(),
    })
    searchDocsMock.mockReturnValue([])
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

    expect(screen.getByText(/Distance:\s+\d+\s+m/)).toBeTruthy()
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

  it('opens the Minesweeper game when the query is minesweeper', async () => {
    const user = userEvent.setup()

    render(<SearchModal open={true} onClose={vi.fn()} />)

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'minesweeper')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Minesweeper' })).toBeTruthy()
    })

    expect(screen.getByText('Mines left: 10')).toBeTruthy()
    expect(screen.getByRole('grid', { name: 'Minesweeper game board' })).toBeTruthy()
  })

  it('filters the command list as partial shebang commands are typed', async () => {
    const user = userEvent.setup()

    render(<SearchModal open={true} onClose={vi.fn()} />)

    const input = screen.getByRole('textbox', { name: 'Search' })

    await user.type(input, '!')
    expect(screen.getByText('!games')).toBeTruthy()
    expect(screen.getByText('!docs')).toBeTruthy()

    await user.type(input, 'd')
    expect(screen.queryByText('!games')).toBeNull()
    expect(screen.getByText('!docs')).toBeTruthy()
  })

  it('searches local docs results for !docs queries and navigates to the selected page', async () => {
    const user = userEvent.setup()

    searchDocsMock.mockReturnValue([
      {
        id: 'about',
        title: 'About Ocotillo',
        path: 'about.md',
        slug: 'about',
        route: '/about',
        content: 'A data management portal',
      },
    ])

    render(<SearchModal open={true} onClose={vi.fn()} />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    await user.type(input, '!docs content')

    expect(searchDocsMock).toHaveBeenLastCalledWith('content')
    expect(screen.getByText('About Ocotillo')).toBeTruthy()
    expect(screen.getByText(/about\.md/i)).toBeTruthy()

    const lastCall = useAbortableListMock.mock.calls.at(-1)?.[0]
    expect(lastCall?.queryOptions?.enabled).toBe(false)

    await user.keyboard('{Enter}')

    expect(goMock).toHaveBeenCalledWith({ to: '/about', type: 'push' })
  })
})
