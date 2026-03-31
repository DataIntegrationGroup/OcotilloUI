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

type Segment = {
  y: number
  center: number
  width: number
}

type Obstacle = {
  id: number
  y: number
  offsetRatio: number
}

type RoadsideDecoration = {
  key: string
  type: 'tree' | 'crowd'
  x: number
  y: number
  scale: number
}

type RaceCarGameModalProps = {
  open: boolean
  onClose: () => void
}

const VIEW_WIDTH = 420
const VIEW_HEIGHT = 430
const SEGMENT_HEIGHT = 28
const SEGMENT_COUNT = Math.ceil(VIEW_HEIGHT / SEGMENT_HEIGHT) + 3
const BASE_ROAD_WIDTH = 350
const ROAD_NARROW_RATE = 0.05
const SCROLL_SPEED = 5
const PLAYER_Y = VIEW_HEIGHT - 96
const PLAYER_HALF_WIDTH = 18
const PLAYER_HALF_HEIGHT = 30
const MIN_ROAD_WIDTH = PLAYER_HALF_WIDTH * 2 + 10
const PLAYER_SPEED = 7
const CENTER_SWAY = 72
const SAFE_INSET = 10
const OBSTACLE_WIDTH = 28
const OBSTACLE_HEIGHT = 36
const OBSTACLE_SPAWN_INTERVAL_MIN = 45
const OBSTACLE_SPAWN_INTERVAL_MAX = 95

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const createInitialSegments = (): Segment[] =>
  Array.from({ length: SEGMENT_COUNT }, (_, index) => ({
    y: index * SEGMENT_HEIGHT - SEGMENT_HEIGHT,
    center: VIEW_WIDTH / 2,
    width: BASE_ROAD_WIDTH,
  }))

const makeNextSegment = (y: number, distance: number, previousCenter: number): Segment => {
  const targetCenter =
    VIEW_WIDTH / 2 +
    Math.sin(distance / 220) * CENTER_SWAY +
    Math.sin(distance / 97) * 26
  const center = previousCenter + (targetCenter - previousCenter) * 0.24
  const width = Math.max(MIN_ROAD_WIDTH, BASE_ROAD_WIDTH - distance * ROAD_NARROW_RATE)

  return { y, center, width }
}

const getSegmentAtY = (segments: Segment[], y: number) =>
  segments.find((segment) => y >= segment.y && y < segment.y + SEGMENT_HEIGHT) ??
  segments[segments.length - 1]

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const createDecorationsForSegment = (
  segment: Segment,
  index: number,
  counter: { current: number }
): RoadsideDecoration[] => {
  const leftEdge = segment.center - segment.width / 2
  const rightEdge = segment.center + segment.width / 2
  const baseY = segment.y + SEGMENT_HEIGHT / 2
  const scale = 0.55 + index / Math.max(SEGMENT_COUNT, 1) * 0.45
  const decorations: RoadsideDecoration[] = []

  const maybePush = (type: 'tree' | 'crowd', side: 'left' | 'right', chance: number) => {
    if (Math.random() > chance) return
    counter.current += 1
    const isLeft = side === 'left'
    const edge = isLeft ? leftEdge : rightEdge
    const xOffset =
      type === 'tree'
        ? 24 + Math.random() * 18
        : 52 + Math.random() * 22

    decorations.push({
      key: `${type}-${side}-${counter.current}`,
      type,
      x: edge + (isLeft ? -xOffset : xOffset),
      y: baseY + (Math.random() * 10 - 5),
      scale: scale * (0.85 + Math.random() * 0.2),
    })
  }

  maybePush('tree', 'left', 0.24)
  maybePush('tree', 'right', 0.24)
  maybePush('crowd', 'left', 0.15)
  maybePush('crowd', 'right', 0.15)

  return decorations
}

export const RaceCarGameModal = ({ open, onClose }: RaceCarGameModalProps) => {
  const keysRef = useRef({ left: false, right: false })
  const playerXRef = useRef(VIEW_WIDTH / 2)
  const distanceRef = useRef(0)
  const segmentsRef = useRef<Segment[]>(createInitialSegments())
  const obstaclesRef = useRef<Obstacle[]>([])
  const obstacleIdRef = useRef(0)
  const obstacleSpawnTimerRef = useRef(randomInt(OBSTACLE_SPAWN_INTERVAL_MIN, OBSTACLE_SPAWN_INTERVAL_MAX))
  const decorationsRef = useRef<RoadsideDecoration[]>([])
  const decorationIdRef = useRef(0)

  const [playerX, setPlayerX] = useState(VIEW_WIDTH / 2)
  const [distanceScore, setDistanceScore] = useState(0)
  const [segments, setSegments] = useState<Segment[]>(createInitialSegments())
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [roadsideDecor, setRoadsideDecor] = useState<RoadsideDecoration[]>([])
  const [isGameOver, setIsGameOver] = useState(false)

  const resetGame = () => {
    const initialSegments = createInitialSegments()
    keysRef.current = { left: false, right: false }
    playerXRef.current = VIEW_WIDTH / 2
    distanceRef.current = 0
    segmentsRef.current = initialSegments
    obstaclesRef.current = []
    obstacleIdRef.current = 0
    obstacleSpawnTimerRef.current = randomInt(
      OBSTACLE_SPAWN_INTERVAL_MIN,
      OBSTACLE_SPAWN_INTERVAL_MAX
    )
    decorationIdRef.current = 0
    decorationsRef.current = initialSegments.flatMap((segment, index) =>
      createDecorationsForSegment(segment, index, decorationIdRef)
    )
    setPlayerX(VIEW_WIDTH / 2)
    setDistanceScore(0)
    setSegments(initialSegments)
    setObstacles([])
    setRoadsideDecor(decorationsRef.current)
    setIsGameOver(false)
  }

  useEffect(() => {
    if (open) {
      resetGame()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyChange = (pressed: boolean) => (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
        event.preventDefault()
      }
      if (key === 'arrowleft' || key === 'a') keysRef.current.left = pressed
      if (key === 'arrowright' || key === 'd') keysRef.current.right = pressed
    }

    const onKeyDown = onKeyChange(true)
    const onKeyUp = onKeyChange(false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [open])

  useEffect(() => {
    if (!open || isGameOver) return

    const interval = window.setInterval(() => {
      const movement =
        (keysRef.current.right ? PLAYER_SPEED : 0) - (keysRef.current.left ? PLAYER_SPEED : 0)
      playerXRef.current = clamp(
        playerXRef.current + movement,
        PLAYER_HALF_WIDTH + 12,
        VIEW_WIDTH - PLAYER_HALF_WIDTH - 12
      )

      distanceRef.current += SCROLL_SPEED

      let nextSegments = segmentsRef.current
        .map((segment) => ({ ...segment, y: segment.y + SCROLL_SPEED }))
        .filter((segment) => segment.y < VIEW_HEIGHT + SEGMENT_HEIGHT)
      let nextDecorations = decorationsRef.current
        .map((item) => ({ ...item, y: item.y + SCROLL_SPEED }))
        .filter((item) => item.y < VIEW_HEIGHT + 40)

      while (nextSegments.length < SEGMENT_COUNT) {
        const topY = nextSegments.length > 0 ? Math.min(...nextSegments.map((segment) => segment.y)) : 0
        const previousTop = nextSegments.reduce<Segment | null>(
          (best, segment) => (best === null || segment.y < best.y ? segment : best),
          null
        )
        const nextY = topY - SEGMENT_HEIGHT
        const nextSegment = makeNextSegment(
          nextY,
          distanceRef.current + Math.abs(nextY),
          previousTop?.center ?? VIEW_WIDTH / 2
        )
        nextSegments = [nextSegment, ...nextSegments]
        nextDecorations = [
          ...createDecorationsForSegment(nextSegment, 0, decorationIdRef),
          ...nextDecorations,
        ]
      }

      segmentsRef.current = nextSegments
      let nextObstacles = obstaclesRef.current
        .map((obstacle) => ({ ...obstacle, y: obstacle.y + SCROLL_SPEED }))
        .filter((obstacle) => obstacle.y < VIEW_HEIGHT + OBSTACLE_HEIGHT)

      obstacleSpawnTimerRef.current -= 1
      const topPlayableSegment = getSegmentAtY(nextSegments, 0)
      const canSpawnObstacle =
        topPlayableSegment.width >= PLAYER_HALF_WIDTH * 2 + OBSTACLE_WIDTH + SAFE_INSET * 2

      if (canSpawnObstacle && obstacleSpawnTimerRef.current <= 0) {
        obstacleSpawnTimerRef.current = randomInt(
          OBSTACLE_SPAWN_INTERVAL_MIN,
          OBSTACLE_SPAWN_INTERVAL_MAX
        )
        const offsetMagnitude = 0.45 + Math.random() * 0.2
        const offsetRatio = Math.random() < 0.5 ? -offsetMagnitude : offsetMagnitude
        nextObstacles = [
          ...nextObstacles,
          {
            id: obstacleIdRef.current += 1,
            y: -OBSTACLE_HEIGHT,
            offsetRatio,
          },
        ]
      } else if (!canSpawnObstacle) {
        obstacleSpawnTimerRef.current = randomInt(
          OBSTACLE_SPAWN_INTERVAL_MIN,
          OBSTACLE_SPAWN_INTERVAL_MAX
        )
      }

      obstaclesRef.current = nextObstacles
      decorationsRef.current = nextDecorations
      setSegments(nextSegments)
      setObstacles(nextObstacles)
      setRoadsideDecor(nextDecorations)
      setPlayerX(playerXRef.current)
      setDistanceScore(Math.floor(distanceRef.current))

      const playerSegment =
        getSegmentAtY(nextSegments, PLAYER_Y)

      const leftEdge = playerSegment.center - playerSegment.width / 2
      const rightEdge = playerSegment.center + playerSegment.width / 2

      if (
        playerXRef.current - PLAYER_HALF_WIDTH < leftEdge + SAFE_INSET ||
        playerXRef.current + PLAYER_HALF_WIDTH > rightEdge - SAFE_INSET
      ) {
        setIsGameOver(true)
      }

      const hitsObstacle = nextObstacles.some((obstacle) => {
        const segment = getSegmentAtY(nextSegments, obstacle.y + OBSTACLE_HEIGHT / 2)
        const usableHalfWidth = Math.max(
          0,
          segment.width / 2 - SAFE_INSET - OBSTACLE_WIDTH / 2
        )
        const obstacleCenterX = segment.center + obstacle.offsetRatio * usableHalfWidth
        const verticalOverlap =
          obstacle.y + OBSTACLE_HEIGHT > PLAYER_Y - PLAYER_HALF_HEIGHT &&
          obstacle.y < PLAYER_Y + PLAYER_HALF_HEIGHT
        const horizontalOverlap =
          Math.abs(obstacleCenterX - playerXRef.current) <
          OBSTACLE_WIDTH / 2 + PLAYER_HALF_WIDTH

        return verticalOverlap && horizontalOverlap
      })

      if (hitsObstacle) {
        setIsGameOver(true)
      }
    }, 32)

    return () => window.clearInterval(interval)
  }, [isGameOver, open])

  const roadPath = useMemo(() => {
    const ordered = [...segments].sort((a, b) => a.y - b.y)
    const left = ordered.map((segment) => `${segment.center - segment.width / 2},${segment.y}`)
    const right = ordered
      .slice()
      .reverse()
      .map((segment) => `${segment.center + segment.width / 2},${segment.y}`)
    return [...left, ...right].join(' ')
  }, [segments])

  const renderedObstacles = useMemo(
    () =>
      obstacles.map((obstacle) => {
        const segment = getSegmentAtY(segments, obstacle.y + OBSTACLE_HEIGHT / 2)
        const usableHalfWidth = Math.max(
          0,
          segment.width / 2 - SAFE_INSET - OBSTACLE_WIDTH / 2
        )
        const centerX = segment.center + obstacle.offsetRatio * usableHalfWidth
        return {
          id: obstacle.id,
          x: centerX - OBSTACLE_WIDTH / 2,
          y: obstacle.y,
        }
      }),
    [obstacles, segments]
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="racecar-game-title"
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: 'calc(100vh - 32px)',
        },
      }}
    >
      <DialogTitle id="racecar-game-title">Race Car</DialogTitle>
      <DialogContent sx={{ pt: 1, overflow: 'hidden' }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Distance: {distanceScore} m
            </Typography>
            <Button variant="outlined" size="small" onClick={resetGame}>
              Restart
            </Button>
          </Stack>

          <Box
            role="img"
            aria-label="Race car game board"
            sx={{
              width: '100%',
              maxWidth: VIEW_WIDTH,
              mx: 'auto',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#14532d',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" height="100%" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#166534" />
                  <stop offset="100%" stopColor="#14532d" />
                </linearGradient>
                <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b5563" />
                  <stop offset="100%" stopColor="#1f2937" />
                </linearGradient>
                <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="55%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>

              <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#grass)" />
              <polygon points={roadPath} fill="url(#road)" />

              {renderedObstacles.map((obstacle) => (
                <g key={obstacle.id}>
                  <rect
                    x={obstacle.x}
                    y={obstacle.y}
                    width={OBSTACLE_WIDTH}
                    height={OBSTACLE_HEIGHT}
                    rx="6"
                    fill="#f97316"
                  />
                  <rect
                    x={obstacle.x + 5}
                    y={obstacle.y + 6}
                    width={OBSTACLE_WIDTH - 10}
                    height={8}
                    rx="3"
                    fill="#fed7aa"
                  />
                </g>
              ))}

              {roadsideDecor.map((item) =>
                item.type === 'tree' ? (
                  <g key={item.key} transform={`translate(${item.x} ${item.y}) scale(${item.scale})`}>
                    <rect x="-4" y="6" width="8" height="18" rx="2" fill="#78350f" />
                    <circle cx="0" cy="-2" r="12" fill="#166534" />
                    <circle cx="-8" cy="4" r="9" fill="#15803d" />
                    <circle cx="8" cy="5" r="9" fill="#15803d" />
                  </g>
                ) : (
                  <g key={item.key} transform={`translate(${item.x} ${item.y}) scale(${item.scale})`}>
                    <circle cx="-8" cy="0" r="4" fill="#fca5a5" />
                    <circle cx="0" cy="-2" r="4.5" fill="#fde68a" />
                    <circle cx="8" cy="1" r="4" fill="#93c5fd" />
                    <rect x="-11" y="3" width="6" height="9" rx="2" fill="#7f1d1d" />
                    <rect x="-3" y="2" width="6" height="10" rx="2" fill="#1d4ed8" />
                    <rect x="5" y="3" width="6" height="9" rx="2" fill="#065f46" />
                  </g>
                )
              )}

              <g>
                <ellipse
                  cx={playerX}
                  cy={PLAYER_Y + 2}
                  rx={PLAYER_HALF_WIDTH + 3}
                  ry={PLAYER_HALF_HEIGHT + 3}
                  fill="rgba(2,6,23,0.22)"
                />
                <rect
                  x={playerX - 16}
                  y={PLAYER_Y - 33}
                  width="32"
                  height="66"
                  rx="12"
                  fill="url(#car-body)"
                />
                <rect
                  x={playerX - 12}
                  y={PLAYER_Y - 18}
                  width="24"
                  height="26"
                  rx="8"
                  fill="#dbeafe"
                />
                <rect
                  x={playerX - 10}
                  y={PLAYER_Y - 14}
                  width="20"
                  height="10"
                  rx="4"
                  fill="#93c5fd"
                />
                <rect
                  x={playerX - 10}
                  y={PLAYER_Y - 2}
                  width="20"
                  height="8"
                  rx="3"
                  fill="#bfdbfe"
                />
                <rect x={playerX - 19} y={PLAYER_Y - 26} width="6" height="15" rx="3" fill="#0f172a" />
                <rect x={playerX + 13} y={PLAYER_Y - 26} width="6" height="15" rx="3" fill="#0f172a" />
                <rect x={playerX - 19} y={PLAYER_Y + 6} width="6" height="15" rx="3" fill="#0f172a" />
                <rect x={playerX + 13} y={PLAYER_Y + 6} width="6" height="15" rx="3" fill="#0f172a" />
                <rect x={playerX - 12} y={PLAYER_Y - 31} width="24" height="5" rx="2.5" fill="#f8fafc" opacity="0.9" />
                <circle cx={playerX - 8} cy={PLAYER_Y - 24} r="2.2" fill="#fef08a" />
                <circle cx={playerX + 8} cy={PLAYER_Y - 24} r="2.2" fill="#fef08a" />
                <circle cx={playerX - 8} cy={PLAYER_Y + 25} r="2.4" fill="#f87171" />
                <circle cx={playerX + 8} cy={PLAYER_Y + 25} r="2.4" fill="#f87171" />
                <rect x={playerX - 4} y={PLAYER_Y - 24} width="8" height="48" rx="3" fill="rgba(255,255,255,0.18)" />
              </g>
            </svg>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Use left/right or A/D to steer. Stay inside the road as it shifts sideways and narrows over time.
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
                Off the road
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                Final distance: {distanceScore} m. Restart to race again.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default RaceCarGameModal
