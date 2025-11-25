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
import { useEffect, useMemo, useState } from 'react'
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

  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 250)
  const [selected, setSelected] = useState(null)

  const { data, isFetching } = useAbortableList({
    resource: 'search',
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: debounced.length >= 2,
      keepPreviousData: true,
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
          <Collapse
            key={params.group}
            in={Boolean(params.children)}
            timeout="auto"
          >
            <Stack
              sx={{
                padding: '10px',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[800],
                borderRadius: '10px',
                margin: '10px',
              }}
            >
              <Typography variant={'h3'}>{params.group}</Typography>
              <Divider sx={{ marginBottom: '5px' }} />
              {params.children}
            </Stack>
          </Collapse>
        )}
        renderOption={(props, option) => (
          <li
            {...props}
            style={{ padding: '10px' }}
            key={option.label + option.group}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <div>
                <Typography
                  sx={{ display: 'block' }}
                  variant="subtitle1"
                  component="div"
                >
                  {option.label}
                </Typography>
                <Typography variant={'body1'}>{option.description}</Typography>
                {/*Well result*/}
                {option.group === 'Wells' && (
                  <div style={{ color: '#666' }}>
                    <WellCard option={option} />
                  </div>
                )}
                {/*Spring result*/}
                {option.group === 'Springs' && (
                  <div style={{ color: '#666' }}>
                    <SpringCard option={option} />
                  </div>
                )}
                {/*Contact result*/}
                {option.group === 'Contacts' && (
                  <div style={{ color: '#666' }}>
                    {option.properties.address.map((address) => (
                      <AddressCard
                        key={'address' + address.id}
                        option={address}
                      />
                    ))}
                    {option.properties.phone.map((phone) => (
                      <PhoneCard key={'phone' + phone.id} option={phone} />
                    ))}
                    {option.properties.email.map((email) => (
                      <EmailCard key={'email' + email.id} option={email} />
                    ))}
                  </div>
                )}
              </div>
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            sx={{
              borderRadius: '10px',
              margin: '10px',
            }}
            label=""
            aria-label="Search"
            slotProps={{
              input: {
                ...params.InputProps,
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
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
