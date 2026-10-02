import { Link as RouterLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { AUTHENTIK_SIGNUP_URL } from '@/config/auth'

export const LandingTopbar = () => (
  <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-[1536px] items-center justify-between px-4 sm:px-8">
      <RouterLink
        to="/"
        className="font-heading text-base font-extrabold uppercase tracking-[0.2em]"
      >
        Ocotillo
      </RouterLink>
      <nav className="flex items-center gap-1 sm:gap-3">
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
