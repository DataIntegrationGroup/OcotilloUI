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

type Vector = {
  x: number
  y: number
}

type Bullet = Vector & {
  id: number
  dx: number
  dy: number
  life: number
}

type Asteroid = Vector & {
  id: number
  dx: number
  dy: number
  radius: number
}

type Ship = Vector & {
  angle: number
  dx: number
  dy: number
}

type AsteroidsGameModalProps = {
  open: boolean
  onClose: () => void
}

const ARENA_WIDTH = 640
const ARENA_HEIGHT = 420
const SHIP_RADIUS = 12
const SHOT_SPEED = 6
const TURN_SPEED = 0.09
const THRUST = 0.18
const DRAG = 0.992
const BULLET_LIFE = 60
const FIRE_COOLDOWN = 10

const wrapPosition = (value: number, max: number) => {
  if (value < 0) return value + max
  if (value > max) return value - max
  return value
}

const distance = (a: Vector, b: Vector) => Math.hypot(a.x - b.x, a.y - b.y)

const createAsteroids = (): Asteroid[] => [
  { id: 1, x: 96, y: 88, dx: 1.1, dy: 0.7, radius: 34 },
  { id: 2, x: 516, y: 124, dx: -0.9, dy: 1, radius: 28 },
  { id: 3, x: 180, y: 330, dx: 0.7, dy: -0.8, radius: 30 },
  { id: 4, x: 530, y: 300, dx: -1.2, dy: -0.6, radius: 22 },
]

const createShip = (): Ship => ({
  x: ARENA_WIDTH / 2,
  y: ARENA_HEIGHT / 2,
  angle: -Math.PI / 2,
  dx: 0,
  dy: 0,
})

export const AsteroidsGameModal = ({ open, onClose }: AsteroidsGameModalProps) => {
  const keysRef = useRef({ left: false, right: false, thrust: false, firing: false })
  const bulletIdRef = useRef(0)
  const fireCooldownRef = useRef(0)
  const shipRef = useRef<Ship>(createShip())
  const bulletsRef = useRef<Bullet[]>([])
  const asteroidsRef = useRef<Asteroid[]>(createAsteroids())

  const [ship, setShip] = useState<Ship>(createShip)
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [asteroids, setAsteroids] = useState<Asteroid[]>(createAsteroids)
  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isVictory, setIsVictory] = useState(false)

  const resetGame = () => {
    keysRef.current = { left: false, right: false, thrust: false, firing: false }
    bulletIdRef.current = 0
    fireCooldownRef.current = 0
    const nextShip = createShip()
    const nextAsteroids = createAsteroids()
    shipRef.current = nextShip
    bulletsRef.current = []
    asteroidsRef.current = nextAsteroids
    setShip(nextShip)
    setBullets([])
    setAsteroids(nextAsteroids)
    setScore(0)
    setIsGameOver(false)
    setIsVictory(false)
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
      if (['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' '].includes(key)) {
        event.preventDefault()
      }

      if (key === 'arrowleft' || key === 'a') keysRef.current.left = pressed
      if (key === 'arrowright' || key === 'd') keysRef.current.right = pressed
      if (key === 'arrowup' || key === 'w') keysRef.current.thrust = pressed
      if (key === ' ') keysRef.current.firing = pressed
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
    if (!open || isGameOver || isVictory) return

    const interval = window.setInterval(() => {
      const currentShip = shipRef.current
      let angle = currentShip.angle
      let dx = currentShip.dx
      let dy = currentShip.dy

      if (keysRef.current.left) angle -= TURN_SPEED
      if (keysRef.current.right) angle += TURN_SPEED

      if (keysRef.current.thrust) {
        dx += Math.cos(angle) * THRUST
        dy += Math.sin(angle) * THRUST
      }

      dx *= DRAG
      dy *= DRAG

      const nextShip = {
        ...currentShip,
        angle,
        dx,
        dy,
        x: wrapPosition(currentShip.x + dx, ARENA_WIDTH),
        y: wrapPosition(currentShip.y + dy, ARENA_HEIGHT),
      }

      let nextBullets = bulletsRef.current
        .map((bullet) => ({
          ...bullet,
          x: wrapPosition(bullet.x + bullet.dx, ARENA_WIDTH),
          y: wrapPosition(bullet.y + bullet.dy, ARENA_HEIGHT),
          life: bullet.life - 1,
        }))
        .filter((bullet) => bullet.life > 0)

      if (fireCooldownRef.current > 0) {
        fireCooldownRef.current -= 1
      }

      if (keysRef.current.firing && fireCooldownRef.current === 0) {
        fireCooldownRef.current = FIRE_COOLDOWN
        nextBullets = [
          ...nextBullets,
          {
            id: bulletIdRef.current += 1,
            x: nextShip.x + Math.cos(angle) * (SHIP_RADIUS + 4),
            y: nextShip.y + Math.sin(angle) * (SHIP_RADIUS + 4),
            dx: Math.cos(angle) * SHOT_SPEED + dx,
            dy: Math.sin(angle) * SHOT_SPEED + dy,
            life: BULLET_LIFE,
          },
        ]
      }

      const movedAsteroids = asteroidsRef.current.map((asteroid) => ({
        ...asteroid,
        x: wrapPosition(asteroid.x + asteroid.dx, ARENA_WIDTH),
        y: wrapPosition(asteroid.y + asteroid.dy, ARENA_HEIGHT),
      }))

      const hitBulletIds = new Set<number>()
      const hitAsteroidIds = new Set<number>()

      for (const bullet of nextBullets) {
        const hit = movedAsteroids.find((asteroid) => distance(bullet, asteroid) < asteroid.radius)
        if (hit) {
          hitBulletIds.add(bullet.id)
          hitAsteroidIds.add(hit.id)
        }
      }

      const remainingBullets = nextBullets.filter((bullet) => !hitBulletIds.has(bullet.id))
      const remainingAsteroids = movedAsteroids.filter((asteroid) => !hitAsteroidIds.has(asteroid.id))

      if (hitAsteroidIds.size > 0) {
        setScore((currentScore) => currentScore + hitAsteroidIds.size * 100)
      }

      if (remainingAsteroids.some((asteroid) => distance(nextShip, asteroid) < asteroid.radius + SHIP_RADIUS - 2)) {
        setIsGameOver(true)
      } else if (remainingAsteroids.length === 0) {
        setIsVictory(true)
      }

      shipRef.current = nextShip
      bulletsRef.current = remainingBullets
      asteroidsRef.current = remainingAsteroids
      setShip(nextShip)
      setBullets(remainingBullets)
      setAsteroids(remainingAsteroids)
    }, 16)

    return () => window.clearInterval(interval)
  }, [isGameOver, isVictory, open])

  const shipPoints = useMemo(() => {
    const nose = `${ship.x + Math.cos(ship.angle) * 16},${ship.y + Math.sin(ship.angle) * 16}`
    const left = `${ship.x + Math.cos(ship.angle + 2.45) * 13},${ship.y + Math.sin(ship.angle + 2.45) * 13}`
    const right = `${ship.x + Math.cos(ship.angle - 2.45) * 13},${ship.y + Math.sin(ship.angle - 2.45) * 13}`
    return `${nose} ${left} ${right}`
  }, [ship.angle, ship.x, ship.y])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="asteroids-game-title">
      <DialogTitle id="asteroids-game-title">Asteroids</DialogTitle>
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
            role="img"
            aria-label="Asteroids game board"
            sx={{
              width: '100%',
              maxWidth: ARENA_WIDTH,
              mx: 'auto',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#020617',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <svg viewBox={`0 0 ${ARENA_WIDTH} ${ARENA_HEIGHT}`} width="100%" height="100%" style={{ display: 'block' }}>
              <rect width={ARENA_WIDTH} height={ARENA_HEIGHT} fill="#020617" />
              {asteroids.map((asteroid) => (
                <circle
                  key={asteroid.id}
                  cx={asteroid.x}
                  cy={asteroid.y}
                  r={asteroid.radius}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="3"
                />
              ))}
              {bullets.map((bullet) => (
                <circle key={bullet.id} cx={bullet.x} cy={bullet.y} r="3" fill="#f8fafc" />
              ))}
              <polygon points={shipPoints} fill="none" stroke="#38bdf8" strokeWidth="3" />
              {keysRef.current.thrust && !isGameOver && !isVictory && (
                <line
                  x1={ship.x + Math.cos(ship.angle + Math.PI) * 8}
                  y1={ship.y + Math.sin(ship.angle + Math.PI) * 8}
                  x2={ship.x + Math.cos(ship.angle + Math.PI) * 18}
                  y2={ship.y + Math.sin(ship.angle + Math.PI) * 18}
                  stroke="#f97316"
                  strokeWidth="3"
                />
              )}
            </svg>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Use left/right or A/D to rotate, up or W to thrust, and space to fire. Clear every asteroid without colliding.
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
                {isVictory ? 'You cleared the field' : 'Ship destroyed'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                {isVictory ? `Final score: ${score}.` : `Final score: ${score}.`} Restart to play again.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default AsteroidsGameModal
