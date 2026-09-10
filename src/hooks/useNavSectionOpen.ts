import { useEffect, useState } from 'react'

/**
 * Open/closed state for a collapsible sidebar group.
 *
 * Navigating into the section opens it. Nothing closes it but the user.
 *
 * Two behaviours this deliberately avoids:
 *
 * - Pinning the group open while its section is active. A group covering the
 *   pages you use most would then never collapse.
 * - Closing the group when you navigate away. Every group trigger is also a
 *   link, so route-driven closing made the sidebar behave like an accordion:
 *   opening one group collapsed the others.
 */
export function useNavSectionOpen(sectionActive: boolean) {
  const [open, setOpen] = useState(sectionActive)

  useEffect(() => {
    if (sectionActive) setOpen(true)
  }, [sectionActive])

  return [open, setOpen] as const
}
