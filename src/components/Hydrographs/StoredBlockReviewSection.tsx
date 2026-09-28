import { CheckCircle, Undo } from '@mui/icons-material'
import { Alert, Button, Chip, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { ReviewStatus } from '@/generated/types.gen'
import {
  type HydrographStoredBlock,
  maturityForReviewStatus,
} from './storedBlocks'

const formatSpan = (block: HydrographStoredBlock) =>
  `${block.start.toLocaleString()} – ${block.end.toLocaleString()}`

/**
 * Stored blocks for the bound well, each with the action that moves it through
 * review. Approving a block approves every reading it covers; returning it to
 * not reviewed puts them back to provisional. Both are one request per block,
 * so a series is never left half approved.
 */
export const StoredBlockReviewSection = ({
  blocks,
  onReviewBlock,
}: {
  blocks: readonly HydrographStoredBlock[]
  onReviewBlock: (blockId: number, reviewStatus: ReviewStatus) => Promise<void>
}) => {
  const [pendingBlockId, setPendingBlockId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (blocks.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No stored blocks for this well yet. Publish a corrected series first.
      </Typography>
    )
  }

  const review = async (blockId: number, reviewStatus: ReviewStatus) => {
    setPendingBlockId(blockId)
    setError(null)
    try {
      await onReviewBlock(blockId, reviewStatus)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Updating the block failed.'
      )
    } finally {
      setPendingBlockId(null)
    }
  }

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        Published series are provisional until approved. Approving a block
        approves every reading in it.
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ py: 0.25 }}>
          {error}
        </Alert>
      ) : null}
      {blocks.map((block) => {
        const approved = block.reviewStatus === 'approved'
        const nextStatus: ReviewStatus = approved ? 'not reviewed' : 'approved'
        const isPending = pendingBlockId === block.id

        return (
          <Stack
            key={block.id}
            spacing={0.5}
            data-testid={`stored-block-${block.id}`}
            sx={{
              p: 1,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="body2" fontWeight={600}>
                Block {block.id}
              </Typography>
              <Chip
                size="small"
                color={approved ? 'success' : 'info'}
                label={maturityForReviewStatus(block.reviewStatus)}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatSpan(block)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {block.readingCount} reading{block.readingCount === 1 ? '' : 's'}
              {block.sourceFile ? ` · ${block.sourceFile}` : ''}
            </Typography>
            <Button
              size="small"
              variant={approved ? 'text' : 'contained'}
              color={approved ? 'inherit' : 'success'}
              startIcon={approved ? <Undo /> : <CheckCircle />}
              onClick={() => review(block.id, nextStatus)}
              disabled={pendingBlockId !== null}
            >
              {isPending
                ? 'Updating…'
                : approved
                  ? 'Return to provisional'
                  : 'Approve'}
            </Button>
          </Stack>
        )
      })}
    </Stack>
  )
}
