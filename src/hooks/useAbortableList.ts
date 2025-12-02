import { useRef } from 'react'
import { useList } from '@refinedev/core'

export const useAbortableList = (options: any) => {
  const abortRef = useRef<AbortController | null>(null)

  // cancel previous request if any
  if (abortRef.current) abortRef.current.abort()
  abortRef.current = new AbortController()

  return useList({
    ...options,
    meta: {
      ...(options.meta ?? {}),
      signal: abortRef.current.signal,
    },
  })
}
