import { useEffect } from 'react'
import { captureEvent } from '@/analytics/posthog'

/**
 * Attaches document-level listeners for copy, cut, and paste events and
 * fires PostHog events for each. The actual copied or pasted text is never
 * captured — only the page path and, for copy/cut, the selection length.
 * Cut is tracked as text_cut, separate from text_copied.
 */
export const useCopyPasteTracking = () => {
  useEffect(() => {
    const handleCopy = () => {
      captureEvent('text_copied', {
        path: window.location.pathname,
        selection_length: window.getSelection()?.toString().length ?? 0,
      })
    }

    const handleCut = () => {
      captureEvent('text_cut', {
        path: window.location.pathname,
        selection_length: window.getSelection()?.toString().length ?? 0,
      })
    }

    const handlePaste = () => {
      captureEvent('text_pasted', {
        path: window.location.pathname,
      })
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCut)
    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCut)
      document.removeEventListener('paste', handlePaste)
    }
  }, [])
}
