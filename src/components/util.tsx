import { Chip } from '@mui/material'
import { useCallback, useEffect, useRef } from 'react'

type PublicReleaseRow = {
  PublicRelease?: boolean
}

export function publicReleaseChip({ row }: { row: PublicReleaseRow }) {
  return (
    <Chip
      size={'small'}
      sx={{
        backgroundColor: row?.PublicRelease ? '#8bd55c' : '#d86969',
        '& .MuiChip-label': {
          padding: 0,
          margin: 3,
        },
      }}
      label={row?.PublicRelease ? 'Yes' : 'No'}
    />
  )
}

export const useDebounce = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
): ((...args: Args) => void) => {
  const handlerRef = useRef<ReturnType<typeof setTimeout>>()
  const debouncedCallback = useCallback(
    (...args: Args) => {
      if (handlerRef.current) {
        clearTimeout(handlerRef.current)
      }
      handlerRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        clearTimeout(handlerRef.current)
      }
    }
  }, [])

  return debouncedCallback
}
