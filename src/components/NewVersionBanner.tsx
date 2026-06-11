import { X } from 'lucide-react'
import { useNewVersion } from '@/hooks/useNewVersion'

export const NewVersionBanner = () => {
  const { isNewVersionAvailable, dismiss } = useNewVersion()

  if (!isNewVersionAvailable) return null

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-indigo-600 text-white text-sm shrink-0">
      <span className="font-medium">
        We just made Ocotillo 5% better. Refresh to get the good stuff!
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded border border-white/60 bg-white/10 hover:bg-white/20 font-medium transition-colors"
        >
          Refresh Now
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 rounded hover:bg-white/20 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
