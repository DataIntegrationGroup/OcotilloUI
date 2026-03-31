import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'

type Cell = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacent: number
}

type MinesweeperGameModalProps = {
  open: boolean
  onClose: () => void
}

const ROWS = 9
const COLS = 9
const MINES = 10

const createBoard = (): Cell[][] => {
  const board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacent: 0,
    }))
  )

  let placed = 0
  while (placed < MINES) {
    const row = Math.floor(Math.random() * ROWS)
    const col = Math.floor(Math.random() * COLS)
    if (!board[row][col].isMine) {
      board[row][col].isMine = true
      placed += 1
    }
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      let adjacent = 0
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue
          const nextRow = row + dy
          const nextCol = col + dx
          if (
            nextRow >= 0 &&
            nextRow < ROWS &&
            nextCol >= 0 &&
            nextCol < COLS &&
            board[nextRow][nextCol].isMine
          ) {
            adjacent += 1
          }
        }
      }
      board[row][col].adjacent = adjacent
    }
  }

  return board
}

const revealFlood = (board: Cell[][], row: number, col: number) => {
  const nextBoard = board.map((cells) => cells.map((cell) => ({ ...cell })))
  const queue: Array<[number, number]> = [[row, col]]

  while (queue.length > 0) {
    const [currentRow, currentCol] = queue.shift()!
    const cell = nextBoard[currentRow][currentCol]
    if (cell.isRevealed || cell.isFlagged) continue
    cell.isRevealed = true

    if (cell.adjacent !== 0 || cell.isMine) continue

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue
        const nextRow = currentRow + dy
        const nextCol = currentCol + dx
        if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) {
          queue.push([nextRow, nextCol])
        }
      }
    }
  }

  return nextBoard
}

export const MinesweeperGameModal = ({ open, onClose }: MinesweeperGameModalProps) => {
  const [board, setBoard] = useState<Cell[][]>(createBoard)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isVictory, setIsVictory] = useState(false)

  const resetGame = () => {
    setBoard(createBoard())
    setIsGameOver(false)
    setIsVictory(false)
  }

  useEffect(() => {
    if (open) {
      resetGame()
    }
  }, [open])

  const revealCell = (row: number, col: number) => {
    if (isGameOver || isVictory) return
    const cell = board[row][col]
    if (cell.isFlagged || cell.isRevealed) return

    if (cell.isMine) {
      setBoard((currentBoard) =>
        currentBoard.map((cells) =>
          cells.map((currentCell) => ({
            ...currentCell,
            isRevealed: currentCell.isRevealed || currentCell.isMine,
          }))
        )
      )
      setIsGameOver(true)
      return
    }

    const nextBoard = revealFlood(board, row, col)
    setBoard(nextBoard)

    const hiddenSafeCells = nextBoard.flat().filter((currentCell) => !currentCell.isMine && !currentCell.isRevealed)
    if (hiddenSafeCells.length === 0) {
      setIsVictory(true)
    }
  }

  const toggleFlag = (row: number, col: number) => {
    if (isGameOver || isVictory) return
    setBoard((currentBoard) =>
      currentBoard.map((cells, rowIndex) =>
        cells.map((cell, colIndex) =>
          rowIndex === row && colIndex === col && !cell.isRevealed
            ? { ...cell, isFlagged: !cell.isFlagged }
            : cell
        )
      )
    )
  }

  const minesLeft = useMemo(
    () => MINES - board.flat().filter((cell) => cell.isFlagged).length,
    [board]
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="minesweeper-game-title"
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: 'calc(100vh - 32px)',
        },
      }}
    >
      <DialogTitle id="minesweeper-game-title">Minesweeper</DialogTitle>
      <DialogContent sx={{ pt: 1, overflow: 'hidden' }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Mines left: {minesLeft}
            </Typography>
            <Button variant="outlined" size="small" onClick={resetGame}>
              Restart
            </Button>
          </Stack>

          <Box
            role="grid"
            aria-label="Minesweeper game board"
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              gap: 0.4,
              p: 0.75,
              width: '100%',
              maxWidth: 300,
              mx: 'auto',
              borderRadius: 2,
              bgcolor: '#cbd5e1',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {board.flatMap((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Box
                  key={`${rowIndex}-${colIndex}`}
                  component="button"
                  type="button"
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    toggleFlag(rowIndex, colIndex)
                  }}
                  sx={{
                    aspectRatio: '1 / 1',
                    border: 'none',
                    borderRadius: 0.5,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    bgcolor: cell.isRevealed ? '#e2e8f0' : '#94a3b8',
                    color: cell.isMine ? '#dc2626' : '#0f172a',
                    boxShadow: cell.isRevealed ? 'inset 0 1px 0 rgba(255,255,255,0.4)' : 'inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  {cell.isRevealed
                    ? cell.isMine
                      ? '*'
                      : cell.adjacent || ''
                    : cell.isFlagged
                      ? 'F'
                      : ''}
                </Box>
              ))
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Click to reveal. Right-click to flag. Clear every safe cell without opening a mine.
          </Typography>

          {(isGameOver || isVictory) && (
            <Box
              sx={{
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
                bgcolor: isVictory ? 'success.light' : 'error.light',
                color: isVictory ? 'success.contrastText' : 'error.contrastText',
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                {isVictory ? 'Board cleared' : 'Boom'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                {isVictory ? 'You found every mine.' : 'You hit a mine.'} Restart to play again.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default MinesweeperGameModal
