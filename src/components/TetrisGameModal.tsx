import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

type Point = {
  x: number
  y: number
}

type ActivePiece = {
  type: PieceType
  rotation: number
  position: Point
}

type TetrisGameModalProps = {
  open: boolean
  onClose: () => void
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const DROP_MS = 260

const PIECE_COLORS: Record<PieceType, string> = {
  I: '#38bdf8',
  O: '#facc15',
  T: '#a855f7',
  S: '#22c55e',
  Z: '#ef4444',
  J: '#3b82f6',
  L: '#fb923c',
}

const PIECE_SHAPES: Record<PieceType, Point[][]> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
    [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ],
  ],
  O: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  ],
  T: [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
}

const PIECE_SEQUENCE: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

const createEmptyBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => ''))

const getPieceCells = (piece: ActivePiece) =>
  PIECE_SHAPES[piece.type][piece.rotation].map((cell) => ({
    x: piece.position.x + cell.x,
    y: piece.position.y + cell.y,
  }))

const isValidPosition = (piece: ActivePiece, board: string[][]) =>
  getPieceCells(piece).every(
    (cell) =>
      cell.x >= 0 &&
      cell.x < BOARD_WIDTH &&
      cell.y < BOARD_HEIGHT &&
      (cell.y < 0 || board[cell.y][cell.x] === '')
  )

const spawnPiece = (index: number): ActivePiece => ({
  type: PIECE_SEQUENCE[index % PIECE_SEQUENCE.length],
  rotation: 0,
  position: { x: 3, y: -1 },
})

const mergePiece = (board: string[][], piece: ActivePiece) => {
  const nextBoard = board.map((row) => [...row])
  for (const cell of getPieceCells(piece)) {
    if (cell.y >= 0) {
      nextBoard[cell.y][cell.x] = PIECE_COLORS[piece.type]
    }
  }
  return nextBoard
}

const clearRows = (board: string[][]) => {
  const remainingRows = board.filter((row) => row.some((cell) => cell === ''))
  const cleared = BOARD_HEIGHT - remainingRows.length
  const newRows = Array.from({ length: cleared }, () => Array.from({ length: BOARD_WIDTH }, () => ''))
  return {
    board: [...newRows, ...remainingRows],
    cleared,
  }
}

export const TetrisGameModal = ({ open, onClose }: TetrisGameModalProps) => {
  const pieceIndexRef = useRef(0)
  const boardRef = useRef<string[][]>(createEmptyBoard())
  const activePieceRef = useRef<ActivePiece>(spawnPiece(0))

  const [board, setBoard] = useState<string[][]>(createEmptyBoard())
  const [activePiece, setActivePiece] = useState<ActivePiece>(spawnPiece(0))
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)

  const resetGame = () => {
    const nextBoard = createEmptyBoard()
    const nextPiece = spawnPiece(0)
    pieceIndexRef.current = 1
    boardRef.current = nextBoard
    activePieceRef.current = nextPiece
    setBoard(nextBoard)
    setActivePiece(nextPiece)
    setScore(0)
    setLines(0)
    setIsGameOver(false)
  }

  const commitState = (nextBoard: string[][], nextPiece: ActivePiece | null) => {
    boardRef.current = nextBoard
    if (nextPiece) {
      activePieceRef.current = nextPiece
      setActivePiece(nextPiece)
    }
    setBoard(nextBoard)
  }

  const lockPiece = () => {
    const merged = mergePiece(boardRef.current, activePieceRef.current)
    const { board: clearedBoard, cleared } = clearRows(merged)

    if (cleared > 0) {
      setLines((current) => current + cleared)
      setScore((current) => current + cleared * 100)
    }

    const nextPiece = spawnPiece(pieceIndexRef.current)
    pieceIndexRef.current += 1

    if (!isValidPosition(nextPiece, clearedBoard)) {
      boardRef.current = clearedBoard
      setBoard(clearedBoard)
      setIsGameOver(true)
      return
    }

    commitState(clearedBoard, nextPiece)
  }

  const movePiece = (dx: number, dy: number) => {
    if (isGameOver) return
    const candidate = {
      ...activePieceRef.current,
      position: {
        x: activePieceRef.current.position.x + dx,
        y: activePieceRef.current.position.y + dy,
      },
    }

    if (isValidPosition(candidate, boardRef.current)) {
      activePieceRef.current = candidate
      setActivePiece(candidate)
      return true
    }

    if (dy > 0) {
      lockPiece()
    }
    return false
  }

  const rotatePiece = () => {
    if (isGameOver) return
    const candidate = {
      ...activePieceRef.current,
      rotation: (activePieceRef.current.rotation + 1) % 4,
    }
    const kicks = [0, -1, 1, -2, 2]

    for (const kick of kicks) {
      const kickedPiece = {
        ...candidate,
        position: {
          x: candidate.position.x + kick,
          y: candidate.position.y,
        },
      }
      if (isValidPosition(kickedPiece, boardRef.current)) {
        activePieceRef.current = kickedPiece
        setActivePiece(kickedPiece)
        return
      }
    }
  }

  const hardDrop = () => {
    if (isGameOver) return
    while (movePiece(0, 1)) {
      continue
    }
  }

  useEffect(() => {
    if (open) {
      resetGame()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', 'a', 'd', 's', 'w', ' '].includes(key)) {
        event.preventDefault()
      }

      if (key === 'arrowleft' || key === 'a') movePiece(-1, 0)
      if (key === 'arrowright' || key === 'd') movePiece(1, 0)
      if (key === 'arrowdown' || key === 's') movePiece(0, 1)
      if (key === 'arrowup' || key === 'w') rotatePiece()
      if (key === ' ') hardDrop()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, isGameOver])

  useEffect(() => {
    if (!open || isGameOver) return

    const interval = window.setInterval(() => {
      movePiece(0, 1)
    }, DROP_MS)

    return () => window.clearInterval(interval)
  }, [open, isGameOver])

  const displayBoard = useMemo(() => {
    const nextBoard = board.map((row) => [...row])
    for (const cell of getPieceCells(activePiece)) {
      if (cell.y >= 0 && cell.y < BOARD_HEIGHT && cell.x >= 0 && cell.x < BOARD_WIDTH) {
        nextBoard[cell.y][cell.x] = PIECE_COLORS[activePiece.type]
      }
    }
    return nextBoard
  }, [activePiece, board])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="tetris-game-title">
      <DialogTitle id="tetris-game-title">Tetris</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Score: {score}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lines: {lines}
            </Typography>
            <Button variant="outlined" size="small" onClick={resetGame}>
              Restart
            </Button>
          </Stack>

          <Box
            role="grid"
            aria-label="Tetris game board"
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
              gap: 0.25,
              p: 0.75,
              width: '100%',
              maxWidth: 280,
              mx: 'auto',
              borderRadius: 2,
              bgcolor: '#020617',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {displayBoard.flatMap((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Box
                  key={`${rowIndex}-${colIndex}`}
                  sx={{
                    aspectRatio: '1 / 1',
                    borderRadius: 0.4,
                    bgcolor: cell || 'rgba(148,163,184,0.12)',
                    boxShadow: cell ? 'inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                  }}
                />
              ))
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Use left/right to move, up to rotate, down to soft drop, and space to hard drop.
          </Typography>

          {isGameOver && (
            <Box
              sx={{
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
                bgcolor: 'error.light',
                color: 'error.contrastText',
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                Game over
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                Final score: {score}. Restart to play again.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default TetrisGameModal
