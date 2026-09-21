// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StoredBlockReviewSection } from '@/components/Hydrographs/StoredBlockReviewSection'
import {
  type StoredReadingActions,
  StoredReadingEditor,
} from '@/components/Hydrographs/StoredReadingEditor'
import {
  type HydrographStoredBlock,
  maturityForReviewStatus,
  nearestIndexByTime,
  summarizeStoredBlocks,
} from '@/components/Hydrographs/storedBlocks'
import type { TransducerObservationDetailResponse } from '@/generated/types.gen'

const blockRow = (
  blockId: number,
  start: string,
  end: string,
  reviewStatus: 'approved' | 'not reviewed' = 'not reviewed'
) => ({
  block: {
    id: blockId,
    start_datetime: start,
    end_datetime: end,
    review_status: reviewStatus,
    source_file: `logger-${blockId}.csv`,
  },
})

describe('summarizeStoredBlocks', () => {
  it('groups readings into their blocks, oldest first, with counts', () => {
    const rows = [
      blockRow(7, '2025-02-01T00:00:00Z', '2025-02-02T00:00:00Z'),
      blockRow(3, '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z', 'approved'),
      blockRow(7, '2025-02-01T00:00:00Z', '2025-02-02T00:00:00Z'),
      blockRow(3, '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z', 'approved'),
      blockRow(7, '2025-02-01T00:00:00Z', '2025-02-02T00:00:00Z'),
    ]

    const blocks = summarizeStoredBlocks(rows)

    expect(blocks.map((block) => block.id)).toEqual([3, 7])
    expect(blocks.map((block) => block.readingCount)).toEqual([2, 3])
    expect(blocks[0].reviewStatus).toBe('approved')
    expect(blocks[1].sourceFile).toBe('logger-7.csv')
  })

  it('returns nothing for no readings', () => {
    expect(summarizeStoredBlocks([])).toEqual([])
  })
})

describe('maturityForReviewStatus', () => {
  it('mirrors the API mapping', () => {
    expect(maturityForReviewStatus('approved')).toBe('approved')
    expect(maturityForReviewStatus('not reviewed')).toBe('provisional')
  })
})

const block = (
  id: number,
  reviewStatus: 'approved' | 'not reviewed'
): HydrographStoredBlock => ({
  id,
  start: new Date('2025-01-15T00:00:00Z'),
  end: new Date('2025-01-15T12:00:00Z'),
  reviewStatus,
  readingCount: 3,
  sourceFile: 'SO-0167.csv',
})

describe('StoredBlockReviewSection', () => {
  it('approves a provisional block', async () => {
    const onReviewBlock = vi.fn().mockResolvedValue(undefined)
    render(
      <StoredBlockReviewSection
        blocks={[block(12, 'not reviewed')]}
        onReviewBlock={onReviewBlock}
      />
    )

    const row = screen.getByTestId('stored-block-12')
    expect(within(row).getByText('provisional')).toBeInTheDocument()
    await userEvent.click(within(row).getByRole('button', { name: 'Approve' }))

    expect(onReviewBlock).toHaveBeenCalledWith(12, 'approved')
  })

  it('returns an approved block to not reviewed', async () => {
    const onReviewBlock = vi.fn().mockResolvedValue(undefined)
    render(
      <StoredBlockReviewSection
        blocks={[block(12, 'approved')]}
        onReviewBlock={onReviewBlock}
      />
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Return to provisional' })
    )

    expect(onReviewBlock).toHaveBeenCalledWith(12, 'not reviewed')
  })

  it('shows why a review failed', async () => {
    const onReviewBlock = vi
      .fn()
      .mockRejectedValue(new Error('Transducer observation block 12 not found'))
    render(
      <StoredBlockReviewSection
        blocks={[block(12, 'not reviewed')]}
        onReviewBlock={onReviewBlock}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    expect(
      await screen.findByText('Transducer observation block 12 not found')
    ).toBeInTheDocument()
  })

  it('says so when there is nothing to review', () => {
    render(<StoredBlockReviewSection blocks={[]} onReviewBlock={vi.fn()} />)

    expect(screen.getByText(/No stored blocks/)).toBeInTheDocument()
  })
})

const detail = (
  overrides: Partial<TransducerObservationDetailResponse['observation']> = {}
): TransducerObservationDetailResponse => ({
  observation: {
    id: 41,
    created_at: '2025-01-15T00:00:00Z',
    release_status: 'provisional',
    value: 42.5,
    observation_datetime: '2025-01-15T06:00:00Z',
    parameter_id: 1,
    deployment_id: 2,
    note: null,
    data_maturity: 'provisional',
    ...overrides,
  },
  block: {
    id: 12,
    created_at: '2025-01-15T00:00:00Z',
    release_status: 'provisional',
    review_status: 'not reviewed',
    start_datetime: '2025-01-15T00:00:00Z',
    end_datetime: '2025-01-15T12:00:00Z',
    parameter_id: 1,
  },
  thing_id: 9,
})

const actionsFor = (
  loaded: TransducerObservationDetailResponse
): StoredReadingActions & {
  load: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
} => ({
  load: vi.fn().mockResolvedValue(loaded),
  update: vi.fn().mockResolvedValue(loaded),
  remove: vi.fn().mockResolvedValue(undefined),
})

describe('StoredReadingEditor', () => {
  it('loads the reading by id and shows its block', async () => {
    const actions = actionsFor(detail())
    render(
      <StoredReadingEditor
        observationId={41}
        actions={actions}
        canEdit
        onClose={vi.fn()}
      />
    )

    expect(await screen.findByDisplayValue('42.5')).toBeInTheDocument()
    expect(actions.load).toHaveBeenCalledWith(41)
    expect(screen.getByText('Block 12 (not reviewed)')).toBeInTheDocument()
  })

  it('will not save a changed value without a note', async () => {
    const actions = actionsFor(detail())
    render(
      <StoredReadingEditor
        observationId={41}
        actions={actions}
        canEdit
        onClose={vi.fn()}
      />
    )

    const value = await screen.findByDisplayValue('42.5')
    await userEvent.clear(value)
    await userEvent.type(value, '40')

    expect(
      screen.getByText('A changed value needs a note saying why.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Reading' })).toBeDisabled()
  })

  it('saves a changed value with its note', async () => {
    const actions = actionsFor(detail())
    render(
      <StoredReadingEditor
        observationId={41}
        actions={actions}
        canEdit
        onClose={vi.fn()}
      />
    )

    const value = await screen.findByDisplayValue('42.5')
    await userEvent.clear(value)
    await userEvent.type(value, '40')
    await userEvent.type(
      screen.getByLabelText('Note'),
      'hand-corrected against tape'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save Reading' }))

    expect(actions.update).toHaveBeenCalledWith(41, {
      value: 40,
      note: 'hand-corrected against tape',
    })
  })

  it('takes a new value without a new note when one is already there', async () => {
    const actions = actionsFor(detail({ note: 'spike removed' }))
    render(
      <StoredReadingEditor
        observationId={41}
        actions={actions}
        canEdit
        onClose={vi.fn()}
      />
    )

    const value = await screen.findByDisplayValue('42.5')
    await userEvent.clear(value)
    await userEvent.type(value, '41')
    await userEvent.click(screen.getByRole('button', { name: 'Save Reading' }))

    expect(actions.update).toHaveBeenCalledWith(41, { value: 41 })
  })

  it('deletes only after confirming, then closes', async () => {
    const actions = actionsFor(detail())
    const onClose = vi.fn()
    render(
      <StoredReadingEditor
        observationId={41}
        actions={actions}
        canEdit
        onClose={onClose}
      />
    )

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete Reading' })
    )
    expect(actions.remove).not.toHaveBeenCalled()

    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm Delete' })
    )

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(actions.remove).toHaveBeenCalledWith(41)
  })

  it('is read-only without edit access', async () => {
    const actions = actionsFor(detail())
    render(
      <StoredReadingEditor
        observationId={41}
        actions={actions}
        canEdit={false}
        onClose={vi.fn()}
      />
    )

    expect(await screen.findByDisplayValue('42.5')).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Save Reading' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Delete Reading' })
    ).not.toBeInTheDocument()
  })

  it('reports a reading that failed to load', async () => {
    const actions = actionsFor(detail())
    actions.load.mockRejectedValue(
      new Error('Transducer observation 41 not found')
    )
    render(
      <StoredReadingEditor
        observationId={41}
        actions={actions}
        canEdit
        onClose={vi.fn()}
      />
    )

    expect(
      await screen.findByText('Transducer observation 41 not found')
    ).toBeInTheDocument()
  })
})

describe('nearestIndexByTime', () => {
  const times = [100, 200, 300, 400]

  it('finds an exact match', () => {
    expect(nearestIndexByTime(times, 300)).toBe(2)
  })

  it('picks the nearer neighbour between two times', () => {
    expect(nearestIndexByTime(times, 240)).toBe(1)
    expect(nearestIndexByTime(times, 260)).toBe(2)
  })

  it('clamps to the ends', () => {
    expect(nearestIndexByTime(times, -50)).toBe(0)
    expect(nearestIndexByTime(times, 9999)).toBe(3)
  })

  it('has nothing to return for an empty series or a bad time', () => {
    expect(nearestIndexByTime([], 100)).toBe(-1)
    expect(nearestIndexByTime(times, Number.NaN)).toBe(-1)
  })
})
