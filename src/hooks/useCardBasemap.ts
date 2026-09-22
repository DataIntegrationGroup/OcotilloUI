import { useContext, useState } from 'react'
import { captureEvent } from '@/analytics/posthog'
import { THEMED_BASEMAP_IDS } from '@/basemaps'
import { ColorModeContext } from '@/contexts'

/**
 * Basemap state for a map card. Seeded from the active color mode so the map
 * matches the app theme on first paint; MapComponent keeps the two in sync
 * until the user picks a basemap of their own.
 */
export const useCardBasemap = (surface: 'well' | 'project' | 'contact') => {
  const { mode } = useContext(ColorModeContext)
  const [basemapId, setBasemapId] = useState<string>(
    () => THEMED_BASEMAP_IDS[mode === 'dark' ? 'dark' : 'light']
  )

  const onBasemapChange = (nextBasemap: string) => {
    setBasemapId(nextBasemap)
  }

  const onUserBasemapChange = (nextBasemap: string) => {
    setBasemapId(nextBasemap)
    captureEvent('map_basemap_changed', { basemap: nextBasemap, surface })
  }

  return { basemapId, onBasemapChange, onUserBasemapChange }
}
