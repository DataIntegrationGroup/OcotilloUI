import * as React from 'react'
import { MOBILE_VIEWPORT_MAX_PX } from '@/constants/breakpoints'

function readIsMobileViewport() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth < MOBILE_VIEWPORT_MAX_PX
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const update = () => {
      setIsMobile(readIsMobileViewport())
    }

    update()

    if (typeof window.matchMedia !== 'function') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }

    const mql = window.matchMedia(
      `(max-width: ${MOBILE_VIEWPORT_MAX_PX - 1}px)`
    )
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return !!isMobile
}
