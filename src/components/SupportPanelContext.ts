import { createContext } from 'react'

export const SupportPanelContext = createContext<{
  isOpen: boolean
  open: () => void
  close: () => void
}>({ isOpen: false, open: () => {}, close: () => {} })
