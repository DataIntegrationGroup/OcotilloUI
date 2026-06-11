import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

async function fetchBuildTime(): Promise<string | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data?.buildTime ?? null
  } catch {
    return null
  }
}

/**
 * Polls /version.json every 5 minutes. Returns true once the server's
 * buildTime differs from the value captured when the app first loaded,
 * indicating that a new version has been deployed.
 *
 * Append ?preview-refresh-banner to any URL to force the banner visible for
 * design review or screenshots.
 */
export const useNewVersion = () => {
  const forceShow = new URLSearchParams(window.location.search).has(
    'preview-refresh-banner'
  )
  const [isNewVersionAvailable, setIsNewVersionAvailable] = useState(forceShow)
  const [dismissed, setDismissed] = useState(false)
  const initialBuildTime = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const buildTime = await fetchBuildTime()
      if (cancelled) return

      if (initialBuildTime.current === null) {
        // First fetch — record the version the user loaded with.
        initialBuildTime.current = buildTime
        return
      }

      if (buildTime !== null && buildTime !== initialBuildTime.current) {
        setIsNewVersionAvailable(true)
      }
    }

    check()
    const timer = setInterval(check, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return {
    isNewVersionAvailable: isNewVersionAvailable && !dismissed,
    dismiss: () => setDismissed(true),
  }
}
