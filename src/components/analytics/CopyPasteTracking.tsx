import { useCopyPasteTracking } from '@/hooks/useCopyPasteTracking'

/**
 * Renderless component that wires up copy/cut/paste event tracking for the
 * entire app. Mount once inside AppProviders.
 */
export const CopyPasteTracking = () => {
  useCopyPasteTracking()
  return null
}
