import { Close, Search } from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { type GeocodeResult, geocodePlaces } from '@/utils/geocode'

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 300

interface MapGeocoderSearchProps {
  onSelect: (result: GeocodeResult) => void
  onClear?: () => void
  /** Map center used to bias results toward what the user is looking at. */
  proximity?: [number, number]
  placeholder?: string
}

export const MapGeocoderSearch = ({
  onSelect,
  onClear,
  proximity,
  placeholder = 'Search place, address, or ZIP',
}: MapGeocoderSearchProps) => {
  const [value, setValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [value])

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    },
    []
  )

  const trimmedQuery = debouncedValue.trim()
  const isQueryable = trimmedQuery.length >= MIN_QUERY_LENGTH

  // Rounded so small map movements do not invalidate the cached query.
  const proximityKey = useMemo(
    () =>
      proximity
        ? `${proximity[0].toFixed(2)},${proximity[1].toFixed(2)}`
        : 'none',
    [proximity]
  )

  const {
    data: results = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['photon-geocode', trimmedQuery, proximityKey],
    queryFn: ({ signal }) => geocodePlaces(trimmedQuery, { proximity, signal }),
    enabled: isQueryable,
    staleTime: 5 * 60 * 1000,
  })

  const clear = () => {
    setValue('')
    setDebouncedValue('')
    setIsOpen(false)
    onClear?.()
  }

  const select = (result: GeocodeResult) => {
    setValue(result.label)
    setDebouncedValue(result.label)
    setIsOpen(false)
    onSelect(result)
  }

  const showDropdown = isOpen && isQueryable
  const hasNoResults = !isFetching && !isError && results.length === 0

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        size="small"
        fullWidth
        value={value}
        placeholder={placeholder}
        inputProps={{ 'aria-label': 'Search the map for a place or address' }}
        onMouseDown={(event) => event.stopPropagation()}
        onChange={(event) => {
          setValue(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay so a result click registers before the dropdown unmounts.
          blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 150)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            clear()
            return
          }
          if (event.key === 'Enter' && results[0]) {
            event.preventDefault()
            select(results[0])
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isFetching ? <CircularProgress size={16} /> : null}
              {value ? (
                <IconButton
                  size="small"
                  aria-label="Clear map search"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={clear}
                >
                  <Close fontSize="small" />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
      />
      {showDropdown && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: 260,
            overflowY: 'auto',
            zIndex: 3,
          }}
        >
          {isError ? (
            <Typography variant="body2" sx={{ px: 1.5, py: 1 }}>
              Search is unavailable right now.
            </Typography>
          ) : hasNoResults ? (
            <Typography variant="body2" sx={{ px: 1.5, py: 1 }}>
              No matches found.
            </Typography>
          ) : (
            <>
              <List dense disablePadding>
                {results.map((result) => (
                  <ListItemButton
                    key={result.id}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={() => select(result)}
                  >
                    <ListItemText
                      primary={result.label}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  px: 1.5,
                  py: 0.5,
                  color: 'text.secondary',
                }}
              >
                Search by Photon &middot; &copy; OpenStreetMap contributors
              </Typography>
            </>
          )}
        </Paper>
      )}
    </Box>
  )
}

export default MapGeocoderSearch
