import { useCallback, useRef, useState } from 'react'
import { useSidebar } from '@/components/ui/use-sidebar'

/**
 * Keeps a side panel in sync with the app sidebar: collapse the sidebar when
 * the panel opens, and restore the previous sidebar state when it closes.
 */
export function useSidebarPanelSync() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const sidebarWasOpen = useRef(false)

  const openPanel = useCallback(() => {
    sidebarWasOpen.current = sidebarOpen
    setSidebarOpen(false)
    setIsPanelOpen(true)
  }, [sidebarOpen, setSidebarOpen])

  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
    if (sidebarWasOpen.current) {
      setSidebarOpen(true)
    }
  }, [setSidebarOpen])

  const togglePanel = useCallback(() => {
    if (isPanelOpen) {
      closePanel()
    } else {
      openPanel()
    }
  }, [closePanel, isPanelOpen, openPanel])

  return { isPanelOpen, openPanel, closePanel, togglePanel }
}
