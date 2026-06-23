import * as React from 'react'

const MOBILE_BREAKPOINT = 768

function readIsMobileViewport() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth < MOBILE_BREAKPOINT
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

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return !!isMobile
}
