import { useMemo } from 'react'
import type { IObservation } from '@/interfaces/ocotillo'

export const useMostRecentObservation = (
  observations: readonly Partial<IObservation>[] = []
) => {
  return useMemo(() => {
    if (observations.length === 0) return undefined

    return [...observations]
      .filter((o) => o.observation_datetime) // only ones with date
      .sort((a, b) => {
        // Newest first
        return (
          new Date(b.observation_datetime!).getTime() -
          new Date(a.observation_datetime!).getTime()
        )
      })[0]
  }, [observations])
}
