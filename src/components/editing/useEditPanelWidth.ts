import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'ocotillo-edit-panel-width'
export const EDIT_PANEL_DEFAULT_WIDTH = 400
export const EDIT_PANEL_MIN_WIDTH = 320
export const EDIT_PANEL_MAX_WIDTH = 720

function clampWidth(width: number) {
  const maxWidth = Math.min(
    EDIT_PANEL_MAX_WIDTH,
    Math.floor(window.innerWidth * 0.55)
  )
  return Math.min(maxWidth, Math.max(EDIT_PANEL_MIN_WIDTH, width))
}

function readStoredWidth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored != null) {
      const parsed = Number(stored)
      if (Number.isFinite(parsed)) {
        return clampWidth(parsed)
      }
    }
  } catch {
    // ignore localStorage errors
  }
  return EDIT_PANEL_DEFAULT_WIDTH
}

export function useEditPanelWidth(enabled: boolean) {
  const [panelWidth, setPanelWidth] = useState(readStoredWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelWidthRef = useRef(panelWidth)

  useEffect(() => {
    panelWidthRef.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    if (!enabled) return

    const handleResize = () => {
      setPanelWidth((current) => clampWidth(current))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [enabled])

  const handleResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()

      const startX = event.clientX
      const startWidth = panelWidthRef.current

      setIsResizing(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMouseMove = (moveEvent: MouseEvent) => {
        const nextWidth = clampWidth(startWidth + (startX - moveEvent.clientX))
        panelWidthRef.current = nextWidth
        setPanelWidth(nextWidth)
      }

      const onMouseUp = () => {
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        try {
          localStorage.setItem(STORAGE_KEY, String(panelWidthRef.current))
        } catch {
          // ignore localStorage errors
        }

        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    []
  )

  return { panelWidth, isResizing, handleResizeStart }
}
