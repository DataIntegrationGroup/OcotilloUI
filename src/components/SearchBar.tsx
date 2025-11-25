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
import { useList, useGo } from '@refinedev/core'
import { useDebounce } from './util'

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  const [selectedValue, setSelectedValue] = useState(null)

  const { data, isFetching } = useList({
    resource: 'search',
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: debouncedQuery.length >= 2,
      staleTime: 60 * 1000,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    meta: {
      params: { q: debouncedQuery },
    },
  })

  const go = useGo()
  useEffect(() => {
    if (!selectedValue) return

    if (selectedValue.group == 'Wells') {
      const thing_type = selectedValue?.properties?.thing_type
      const WATER_WELL = 'water well'
      const thing_url = thing_type === WATER_WELL ? 'well' : 'spring'

      const id = selectedValue?.properties?.id ?? ''
      go({
        to: `ocotillo/${thing_url}/show/${id}`,
      })
    }
  }, [selectedValue])

  const searchResults = useMemo(() => {
    return (
      data?.data?.map((r) => ({
        label: r.label ?? '',
        group: r.group ?? 'Results',
        raw: r,
      })) ?? []
    )
  }, [data])

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
        loading={isFetching}
        loadingText="Searching..."
        noOptionsText={
          searchQuery.length === 0 ? 'Type to search' : 'No results'
        }
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
        options={searchResults}
        getOptionLabel={
          (option) =>
            typeof option === 'string'
              ? option // user‑typed string
              : (option.label ?? '') // your object’s label
        }
        isOptionEqualToValue={
          (option, value) =>
            typeof value === 'string'
              ? option.label === value // matching a freeSolo string
              : option.label === (value as any).label // matching an object
        }
        // control the text field
        inputValue={searchQuery}
        onInputChange={(_, newInput) => {
          console.log('Input changed:', { newInput })
          setSearchQuery(newInput)
        }}
        // control the selected value
        value={selectedValue}
        onChange={(_, newValue) => {
          setSelectedValue(newValue)
        }}
        openOnFocus
        disableClearable
        freeSolo
        groupBy={(option) => option?.group}
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
