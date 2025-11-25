import { Box } from '@mui/system'
import {
  Autocomplete,
  Collapse,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { Search } from 'react-flaticons'
import Stack from '@mui/material/Stack'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AddressCard,
  EmailCard,
  PhoneCard,
  SpringCard,
  WellCard,
} from '@/components/SearchResultCard'
import { useGo } from '@refinedev/core'
import { useDebounce, useAbortableList } from '../hooks'

export const SearchBar = () => {
  const go = useGo()

  const inputRef = useRef<HTMLInputElement | null>(null)

  const MIN_LENGTH_FOR_SEARCH = 1
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 500)
  const [selected, setSelected] = useState(null)

  const { data, isFetching } = useAbortableList({
    resource: 'search',
    dataProviderName: 'ocotillo',
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
  const results = useMemo(() => {
    return (
      data?.data?.map((r) => ({
        label: r.label,
        description: r.description,
        group: r.group || 'Results',
        properties: r.properties,
        raw: r,
      })) ?? []
    )
  }, [data])

  // Navigate automatically when a result is chosen
  useEffect(() => {
    if (!selected) return
    const { group, properties } = selected

    if (group === 'Wells') {
      const type = properties?.thing_type
      const WATER_WELL = 'water well'
      const url = type === WATER_WELL ? 'well' : 'spring'
      go({ to: `ocotillo/${url}/show/${properties?.id}` })
    }
  }, [selected])

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

  // Highlight matched text
  const highlight = (text: string, query: string) => {
    if (!query) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text

    return (
      <>
        {text.substring(0, idx)}
        <strong style={{ color: '#1976d2' }}>
          {text.substring(idx, idx + query.length)}
        </strong>
        {text.substring(idx + query.length)}
      </>
    )
  }

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
        noOptionsText={query.length === 0 ? 'Type to search' : 'No results'}
        options={results}
        value={selected}
        inputValue={query}
        onInputChange={(_, v) => setQuery(v)}
        onChange={(_, v) => setSelected(v)}
        getOptionLabel={(o) => (typeof o === 'string' ? o : o.label || '')}
        isOptionEqualToValue={(o, v) =>
          o?.label === (typeof v === 'string' ? v : v?.label)
        }
        groupBy={(o) => o.group}
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
              maxHeight: 600, // Optional: set max height
            },
          },
          listbox: {
            sx: {
              maxHeight: 600, // Optional: set max height
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
        renderOption={(props, option) => (
          <li {...props} key={option.label}>
            <Stack spacing={0.3}>
              <Typography variant="subtitle1">
                {highlight(option.label, query)}
              </Typography>

              {option.description && (
                <Typography variant="body2">
                  {highlight(option.description, query)}
                </Typography>
              )}

              {/* Custom metadata cards */}
              {option.group === 'Wells' && <WellCard option={option} />}
              {option.group === 'Springs' && <SpringCard option={option} />}
              {option.group === 'Contacts' && (
                <>
                  {option.properties.address.map((a) => (
                    <AddressCard key={a.id} option={a} />
                  ))}
                  {option.properties.phone.map((p) => (
                    <PhoneCard key={p.id} option={p} />
                  ))}
                  {option.properties.email.map((e) => (
                    <EmailCard key={e.id} option={e} />
                  ))}
                </>
              )}
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label=""
            aria-label="Search"
            sx={{
              borderRadius: '10px',
              margin: '10px',
            }}
            slotProps={{
              input: {
                ...params.InputProps,
                disableUnderline: true,
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

export default SearchBar
