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

type Direction = 'up' | 'down' | 'left' | 'right'

type Point = {
  x: number
  y: number
}

type SnakeGameModalProps = {
  open: boolean
  onClose: () => void
}

const BOARD_SIZE = 20
const TICK_MS = 140
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]
const INITIAL_DIRECTION: Direction = 'right'

const randomFood = (snake: Point[]): Point => {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`))
  const available: Point[] = []

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y })
      }
    }
  }

  return available[Math.floor(Math.random() * available.length)] ?? { x: 0, y: 0 }
}

const isOppositeDirection = (next: Direction, current: Direction) => {
  return (
    (next === 'up' && current === 'down') ||
    (next === 'down' && current === 'up') ||
    (next === 'left' && current === 'right') ||
    (next === 'right' && current === 'left')
  )
}

export const SnakeGameModal = ({ open, onClose }: SnakeGameModalProps) => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE)
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [food, setFood] = useState<Point>(() => randomFood(INITIAL_SNAKE))
  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const queuedDirectionRef = useRef<Direction>(INITIAL_DIRECTION)

  const resetGame = () => {
    queuedDirectionRef.current = INITIAL_DIRECTION
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setFood(randomFood(INITIAL_SNAKE))
    setScore(0)
    setIsGameOver(false)
  }

  useEffect(() => {
    if (!open) return
    resetGame()
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const nextDirection =
        key === 'arrowup' || key === 'w'
          ? 'up'
          : key === 'arrowdown' || key === 's'
            ? 'down'
            : key === 'arrowleft' || key === 'a'
              ? 'left'
              : key === 'arrowright' || key === 'd'
                ? 'right'
                : null

      if (!nextDirection) return

      event.preventDefault()
      if (isOppositeDirection(nextDirection, queuedDirectionRef.current)) return
      queuedDirectionRef.current = nextDirection
      setDirection(nextDirection)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open || isGameOver) return

    const interval = window.setInterval(() => {
      setSnake((currentSnake) => {
        const currentHead = currentSnake[0]
        const nextDirection = queuedDirectionRef.current
        const nextHead =
          nextDirection === 'up'
            ? { x: currentHead.x, y: currentHead.y - 1 }
            : nextDirection === 'down'
              ? { x: currentHead.x, y: currentHead.y + 1 }
              : nextDirection === 'left'
                ? { x: currentHead.x - 1, y: currentHead.y }
                : { x: currentHead.x + 1, y: currentHead.y }

        const hitsWall =
          nextHead.x < 0 ||
          nextHead.x >= BOARD_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= BOARD_SIZE

        const grows = nextHead.x === food.x && nextHead.y === food.y
        const nextBody = grows ? currentSnake : currentSnake.slice(0, -1)
        const hitsSelf = nextBody.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)

        if (hitsWall || hitsSelf) {
          setIsGameOver(true)
          return currentSnake
        }

        const updatedSnake = [nextHead, ...nextBody]

        if (grows) {
          setScore((currentScore) => currentScore + 1)
          setFood(randomFood(updatedSnake))
        }

        return updatedSnake
      })
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [food, isGameOver, open])

  const cells = useMemo(() => {
    const snakeCells = new Set(snake.map((segment) => `${segment.x},${segment.y}`))

    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
      const x = index % BOARD_SIZE
      const y = Math.floor(index / BOARD_SIZE)
      const key = `${x},${y}`
      const isHead = snake[0]?.x === x && snake[0]?.y === y
      const isSnakeCell = snakeCells.has(key)
      const isFoodCell = food.x === x && food.y === y

      return { key, isHead, isSnakeCell, isFoodCell }
    })
  }, [food, snake])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="snake-game-title"
    >
      <DialogTitle id="snake-game-title">Snake</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Score: {score}
            </Typography>
            <Button variant="outlined" size="small" onClick={resetGame}>
              Restart
            </Button>
          </Stack>

          <Box
            role="grid"
            aria-label="Snake game board"
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              gap: 0.5,
              p: 1,
              width: '100%',
              maxWidth: 560,
              mx: 'auto',
              borderRadius: 2,
              bgcolor: '#0f172a',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {cells.map((cell) => (
              <Box
                key={cell.key}
                sx={{
                  aspectRatio: '1 / 1',
                  borderRadius: 0.75,
                  bgcolor: cell.isFoodCell
                    ? '#fb7185'
                    : cell.isHead
                      ? '#f8fafc'
                      : cell.isSnakeCell
                        ? '#22c55e'
                        : 'rgba(148,163,184,0.16)',
                }}
              />
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Use the arrow keys or WASD to move. Eat the red food and avoid walls or your own tail.
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

export default SnakeGameModal
