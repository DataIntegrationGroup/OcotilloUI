import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material'
import { useContext } from 'react'
import { Link as RouterLink } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AUTHENTIK_SIGNUP_URL } from '@/config/auth'
import { ColorModeContext } from '@/contexts'

export const LandingTopbar = () => {
  const { mode, setMode } = useContext(ColorModeContext)
  const toggleLabel =
    mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1536px] items-center justify-between px-4 sm:px-8">
        <RouterLink
          to="/"
          className="font-heading text-base font-extrabold uppercase tracking-[0.2em]"
        >
          Ocotillo
        </RouterLink>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMode()}
                aria-label={toggleLabel}
              >
                {mode === 'dark' ? (
                  <LightModeOutlined />
                ) : (
                  <DarkModeOutlined />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{toggleLabel}</TooltipContent>
          </Tooltip>
          <Button asChild variant="outline" size="sm">
            <RouterLink to="/login">Log in</RouterLink>
          </Button>
          <Button asChild size="sm">
            <a href={AUTHENTIK_SIGNUP_URL} target="_blank" rel="noreferrer">
              Sign up
            </a>
          </Button>
        </nav>
      </div>
    </header>
  )
}
