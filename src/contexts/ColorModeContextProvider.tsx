import { ThemeProvider } from '@mui/material'
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { getTheme } from '@/theme'
import {
  COLOR_MODE_STORAGE_KEY,
  type ColorModePreference,
  isColorModePreference,
  resolveColorMode,
} from '@/utils/userProfile'
import { ColorModeContext } from './ColorModeContext'

const DARK_QUERY = '(prefers-color-scheme: dark)'

const storedPreference = (): ColorModePreference => {
  const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
  // Anything older or unrecognised falls back to following the OS, which is
  // what this app did before "system" was an explicit choice.
  return isColorModePreference(stored) ? stored : 'system'
}

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [preference, setPreference] =
    useState<ColorModePreference>(storedPreference)
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window?.matchMedia(DARK_QUERY).matches ?? false
  )

  const mode = resolveColorMode(preference, systemPrefersDark)

  // Apply the class before paint so Tailwind/shadcn dark styles don't flash
  document.documentElement.classList.toggle('dark', mode === 'dark')

  // Following the OS means following it as it changes, not only at load.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) =>
      setSystemPrefersDark(event.matches)

    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference)
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [preference, mode])

  const setColorMode = (next?: ColorModePreference) => {
    if (isColorModePreference(next)) {
      setPreference(next)
    } else {
      // No argument still means "flip what I'm looking at", which is how the
      // header toggle has always called this.
      setPreference(mode === 'light' ? 'dark' : 'light')
    }
  }

  const theme = useMemo(() => getTheme(mode), [mode])

  return (
    <ColorModeContext.Provider
      value={{
        mode,
        preference,
        setMode: setColorMode,
      }}
    >
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  )
}
