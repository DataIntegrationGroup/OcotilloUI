import { useNewVersion } from '@/hooks/useNewVersion'

export const NewVersionBanner = () => {
  const { isNewVersionAvailable } = useNewVersion()

  if (!isNewVersionAvailable) return null

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-indigo-600 text-white text-sm shrink-0">
      <span className="font-medium">
        We just made Ocotillo 5% better. Refresh to get the good stuff!
      </span>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 px-3 py-1 rounded border border-white/60 bg-white/10 hover:bg-white/20 font-medium transition-colors"
      >
        Refresh Now
      </button>
    </div>
  )
}
