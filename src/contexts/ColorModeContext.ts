import { createContext } from 'react'
import type {
  ColorModePreference,
  ResolvedColorMode,
} from '@/utils/userProfile'

export type ColorModeContextType = {
  /** The mode actually rendering right now — never "system". */
  mode: ResolvedColorMode
  /** What the user chose, which may be "system". */
  preference: ColorModePreference
  setMode: (mode?: ColorModePreference) => void
}

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
)
