import { createContext } from 'react'

export const SupportPanelContext = createContext<{
  isOpen: boolean
  open: () => void
  close: () => void
  /** Page-level panels (e.g. well edit) register a close handler for panel mutex. */
  registerSecondaryPanelClose: (close: (() => void) | null) => void
}>({
  isOpen: false,
  open: () => {},
  close: () => {},
  registerSecondaryPanelClose: () => {},
})
