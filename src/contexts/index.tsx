import React, {
  PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from 'react'
import { ThemeProvider } from '@mui/material'
import { getTheme } from '@/theme'

type ColorModeContextType = {
  mode: string
  setMode: (mode?: string) => void
}

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
)

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const colorModeFromLocalStorage = localStorage.getItem('colorMode')
  const isSystemPreferenceDark = window?.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  const systemPreference = isSystemPreferenceDark ? 'dark' : 'light'
  const initialMode = colorModeFromLocalStorage || systemPreference

  // Apply class immediately so shadcn/Tailwind dark styles don't flash on load
  document.documentElement.classList.toggle('dark', initialMode === 'dark')

  const [mode, setMode] = useState(initialMode)

  useEffect(() => {
    window.localStorage.setItem('colorMode', mode)
    // Sync the .dark class on <html> so Tailwind/shadcn dark variants activate
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  const setColorMode = (next?: string) => {
    if (next === 'light' || next === 'dark') {
      setMode(next)
    } else {
      setMode(mode === 'light' ? 'dark' : 'light')
    }
  }

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
      }}
    >
      <ThemeProvider theme={getTheme(mode as 'light' | 'dark')}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
