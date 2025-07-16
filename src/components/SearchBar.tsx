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
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AddressCard,
  EmailCard,
  PhoneCard,
  SpringCard,
  WellCard,
} from '@/components/SearchResultCard'

const results = [
  {
    label: 'John Well',
    description: 'Description for option 1',
    properties: {
      well_type: 'Production',
      county: 'Rio Arriba',
      series: {
        observed_property: 'groundwater level',
        sensor: 'manual',
      },
    },
    group: 'Wells',
  },
  {
    label: "Doe's well",
    description: 'Description for option 2',
    properties: {
      well_type: 'Observation',
      county: 'Santa Fe',
      series: {
        observed_property: 'groundwater level',
        sensor: 'continuous',
      },
    },
    group: 'Wells',
  },
  {
    label: 'NM-0912',
    description: 'Description for option 3',
    properties: {
      well_type: 'Irrigation',
      county: 'Bernalillo',
      series: {
        observed_property: 'groundwater level',
        sensor: 'manual',
      },
    },
    group: 'Wells',
  },
  {
    label: 'NM-0912spring',
    description: 'Description for option 1',
    properties: {
      county: 'Taos',
    },
    group: 'Springs',
  },
  {
    label: 'NM-0912a',
    description: 'Description for option 1',
    properties: {
      county: 'San Miguel',
    },
    group: 'Springs',
  },
  {
    label: "Doe's spring",
    description: 'Description for option 2',
    properties: {
      county: 'Los Alamos',
    },
    group: 'Springs',
  },
  {
    label: 'John Doe',
    description: 'Description for option 1',
    properties: {
      address: [
        {
          address_line_1: '123 Main St',
          address_line_2: 'Apt 4B',
          city: 'Springfield',
          state: 'IL',
          zip_code: '62701',
          type: 'Primary',
          id: '1',
        },
      ],
      phone: [{ phone_number: '555-1234', type: 'Primary', id: '1' }],
      email: [{ email: 'foo@bar.com', type: 'Primary', id: '1' }],
    },
    group: 'Contacts',
  },
]

export const searchService = async (query: string) => {
  if (!query) return []

  return results.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  )
}

export const SearchBar = () => {
  const [searchInput, setSearchInput] = useState('')
  const [selectedValue, setSelectedValue] = useState(null)

  const searchQuery = useQuery({
    queryKey: ['search', searchInput],
    queryFn: () => searchService(searchInput),
    enabled: !!searchInput,
  })

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
        options={searchQuery?.data ?? results}
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
        inputValue={searchInput}
        onInputChange={(_, newInput) => {
          setSearchInput(newInput)
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
            label="Search"
            slotProps={{
              input: {
                ...params.InputProps,
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
