import { Box } from '@mui/system'
import {
  Autocomplete,
  Collapse,
  Divider,
  InputAdornment,
  ListItem,
  ListItemButton,
  TextField,
  Typography,
} from '@mui/material'
import { Search } from 'react-flaticons'
import Stack from '@mui/material/Stack'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AssetCard,
  ContactCard,
  SpringCard,
  WellCard,
} from '@/components/SearchResultCard'
import { useGo } from '@refinedev/core'
import { useDebounce, useAbortableList } from '../hooks'
import { GroupType } from '@/constants'
import { SearchResult } from '@/interfaces/ocotillo/SearchResult'
import { highlight } from '@/utils'

export const SearchBar = () => {
  const go = useGo()

  const inputRef = useRef<HTMLInputElement | null>(null)

  const MIN_LENGTH_FOR_SEARCH = 1
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 500)
  const [selected, setSelected] = useState(null)

  const { data, isFetching, isError } = useAbortableList({
    resource: 'search',
    dataProviderName: 'ocotillo',
    pagination: {
      pageSize: 100,
    },
    queryOptions: {
      enabled: debounced.length >= MIN_LENGTH_FOR_SEARCH,
      staleTime: 120_000,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    meta: {
      params: { q: debounced },
    },
  })

  // Normalize options
  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return []

    if (!isFetching) {
      if (isError) {
        return [
          {
            group: GroupType.Messages,
            label: 'Search failed. Please try again.',
            __error: true,
          },
        ]
      }

      if (data?.data?.length === 0) {
        return [
          {
            group: GroupType.Messages,
            label: 'No results found. Try a well ID, site name, or contact.',
            __empty: true,
          },
        ]
      }
    }

    const normalized =
      data?.data.map((r) => ({
        label: r.label,
        description: r.description,
        group: r.group as GroupType,
        properties: r.properties,
      })) ?? []

    return dedupeResults(normalized)
  }, [data, query, isFetching, isError])

  // Navigate automatically when a result is chosen
  const navigateToResult = (option: SearchResult) => {
    switch (option.group) {
      case GroupType.Wells:
      case GroupType.Springs: {
        const isWaterWell = option.properties.thing_type === 'water well'
        go({
          to: `ocotillo/${isWaterWell ? 'well' : 'spring'}/show/${option.properties.id}`,
        })
        break
      }
      case GroupType.Contacts:
        go({ to: `ocotillo/contact/show/${option.properties.id}` })
        break

      case GroupType.Assets:
        go({
          to: `ocotillo/assets/show/${option.properties.id}`,
        })
        break
    }
  }

  // Add hotkeys for navigation
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmdKey = isMac ? e.metaKey : e.ctrlKey

      if (cmdKey && e.key.toLowerCase() === 'k') {
        e.preventDefault() // stop browser search box
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        flexGrow: 1,
        borderRadius: '5px',
        margin: '10px',
        height: '40px', // enforce height to match nav bar
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Autocomplete
        freeSolo
        openOnFocus
        disableClearable
        loading={isFetching}
        loadingText="Searching..."
        options={results}
        value={selected}
        inputValue={query}
        // Prevent MUI from filtering out our "__empty" placeholder option.
        // Without this, the listbox never opens and renderOption won't fire.
        filterOptions={(options) => options}
        onInputChange={(_, v) => setQuery(v)}
        onChange={(_, value) => {
          if (!value || typeof value === 'string') return
          setSelected(value)
          navigateToResult(value)
        }}
        getOptionLabel={(o) => {
          if (o.__empty) return o.label
          return typeof o === 'string' ? o : o.label || ''
        }}
        isOptionEqualToValue={(o, v) =>
          o?.label === (typeof v === 'string' ? v : v?.label)
        }
        groupBy={(o) => o.group ?? GroupType.Messages}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              border: 'none',
            },
            '&:hover fieldset': {
              border: 'none',
            },
            '&.Mui-focused fieldset': {
              border: 'none',
            },
          },
          '& .MuiInputBase-input:focus-visible': {
            outline: 'none',
          },
        }}
        slotProps={{
          paper: {
            sx: {
              maxHeight: 600,
            },
          },
          listbox: {
            sx: {
              maxHeight: 600,
              overflowY: 'auto', // Enable scrolling if content exceeds max height
            },
          },
        }}
        renderGroup={(params) => (
          <Collapse key={params.group} in>
            <Stack sx={{ p: 1.5 }}>
              <Typography variant="h6" sx={{ opacity: 0.7 }}>
                {params.group}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {params.children}
            </Stack>
          </Collapse>
        )}
        renderOption={(props, option) => {
          if (option.__empty || option.__error) {
            return (
              <li
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  listStyle: 'none',
                  fontSize: '14px',
                }}
              >
                {option.label}
              </li>
            )
          }

          return (
            <li
              {...props}
              key={`${option.group}-${option.properties?.id ?? option.label}`}
            >
              <ListItem disablePadding>
                <ListItemButton
                  sx={{
                    alignItems: 'flex-start',
                    borderRadius: '8px',
                    my: 0.5,
                    px: 2,
                    py: 1.5,
                    border: '1px solid #eee',
                    boxShadow: 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation() // prevents double select
                    navigateToResult(option)
                    setSelected(option)
                  }}
                >
                  <Stack spacing={1} sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {highlight(option.label, query)}
                    </Typography>
                    {option.description && (
                      <Typography variant="body2" color="text.secondary">
                        {highlight(option.description, query)}
                      </Typography>
                    )}
                    <Divider />
                    <Box sx={{ pt: 0.5 }}>
                      {option.group === GroupType.Wells && (
                        <WellCard well={option} />
                      )}
                      {option.group === GroupType.Springs && (
                        <SpringCard spring={option} />
                      )}
                      {option.group === GroupType.Contacts && (
                        <ContactCard contact={option} query={query} />
                      )}
                      {option.group === GroupType.Assets && (
                        <AssetCard asset={option} query={query} />
                      )}
                    </Box>
                  </Stack>
                </ListItemButton>
              </ListItem>
            </li>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label=""
            autoComplete="off"
            aria-label="Search"
            placeholder="Search for a well or spring by ID or site name…"
            sx={{
              position: 'relative',
              borderRadius: '10px',
              margin: '10px',
            }}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <kbd
                      aria-hidden={true}
                      style={{
                        display: 'inline-block',
                        userSelect: 'none',
                        whiteSpace: 'pre',
                        background: '#f5f5f5',
                        marginRight: 8,
                        paddingLeft: 4,
                        paddingRight: 4,
                        paddingTop: 2,
                        paddingBottom: 2,
                        lineHeight: '20px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        letterSpacing: isMac ? '1.5px' : '0.5px',
                        border: '1px solid #ccc',
                        borderRadius: '7px',
                      }}
                    >
                      {isMac ? '⌘K' : 'Ctrl+K'}
                    </kbd>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />
    </Box>
  )
}

const dedupeResults = (items: SearchResult[]): SearchResult[] => {
  const seen = new Set<string>()

  return items.filter((item) => {
    // Messages don't have properties.id → always keep
    if (item.group === GroupType.Messages) return true

    const id = (item as any).properties?.id
    if (!id) return true

    const key = `${item.group}-${id}`

    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default SearchBar
