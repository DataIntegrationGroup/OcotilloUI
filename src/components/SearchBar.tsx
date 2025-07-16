import { Box } from '@mui/system'
import { Autocomplete, Collapse, TextField, Card, Chip, InputAdornment, Popper } from '@mui/material'
import { Search } from '@mui/icons-material'
import Stack from '@mui/material/Stack'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

const results = [
  {
    label: 'John Well',
    description: 'Description for option 1',
    properties: {
      well_type: 'Production',
      county: 'Rio Arriba',
    },
    group: 'Wells',
  },
  {
    label: "Doe's well",
    description: 'Description for option 2',
    properties: {
      well_type: 'Observation',
      county: 'Santa Fe',
    },
    group: 'Wells',
  },
  {
    label: 'NM-0912',
    description: 'Description for option 3',
    properties: {
      well_type: 'Irrigation',
      county: 'Bernalillo',
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
        },
      ],
      phone: [{ phone_number: '555-1234', type: 'Primary' }],
      email: [{ email: 'foo@bar.com', type: 'Primary' }],
    },
    group: 'Contacts',
  },
]

export const searchService = async (query: string) => {
  if (!query) return [];

  return results.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );
}

function AddressCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px' }}>
      <Chip color="default" label={option.type} />
      {option.address_line_1}, {option.address_line_2}, {option.city},{' '}
      {option.state} {option.zip_code}
    </Card>
  )
}

function PhoneCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px' }}>
      <Chip color="default" label={option.type} />
      {option.phone_number}
    </Card>
  )
}

function EmailCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px' }}>
      <Chip color="default" label={option.type} />
      {option.email}
    </Card>
  )
}

export const SearchBar = () => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedValue, setSelectedValue] = useState(null);

  const searchQuery = useQuery({
    queryKey: ['search', searchInput],
    queryFn: () => searchService(searchInput),
    enabled: !!searchInput,
  });

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        flexGrow: 1,
        borderRadius: '5px',
        margin: '10px',
        height: '40px',   // enforce height to match nav bar
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Autocomplete
        sx={{
          width: '100%',
          '& .MuiInputBase-root': {
            height: '40px',
          },
          zIndex: 1500, // Ensure it's higher than surrounding components
          '& .MuiAutocomplete-popper': {
            zIndex: 1500,
          },
        }}
        disablePortal={false}
        disableClearable
        freeSolo
        options={searchQuery?.data ?? []}
        onChange={(_event, newValue) => setSelectedValue(newValue)}
        value={selectedValue}
        onInputChange={(_event, newInput) => setSearchInput(newInput)}
        inputValue={searchInput}
        isOptionEqualToValue={(option, value) => option.label === value?.label}
        clearOnBlur={false}
        groupBy={(option) => option?.group}
        getOptionLabel={(option) => option.label}
        renderGroup={(params) => (
          <Collapse in={Boolean(params.children)} timeout="auto">
            <Stack
              sx={{
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '10px',
                margin: '10px',
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  color: '#066b78',
                  marginBottom: '5px',
                }}
              >
                {params.group}
              </div>
              {params.children}
            </Stack>
          </Collapse>
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.label}>
            {option.label}
          </li>
          // <li {...props} style={{ padding: '10px' }}>
          //   <Stack direction="row" alignItems="center" spacing={2}>
          //     <div>
          //       <strong>{option.label}</strong>
          //       <div style={{ color: '#666' }}>{option.description}</div>
          //       {option.group === 'Wells' && (
          //         <div style={{ color: '#666' }}>
          //           {
          //             <Chip
          //               color={'primary'}
          //               label={option.properties.well_type}
          //             />
          //           }
          //           {
          //             <Chip
          //               color={'secondary'}
          //               label={option.properties.county}
          //             />
          //           }
          //         </div>
          //       )}
          //       {option.group === 'Contacts' && (
          //         <div style={{ color: '#666' }}>
          //           {option.properties.address.map((address) => (
          //             <AddressCard option={address} />
          //           ))}
          //           {option.properties.phone.map((phone) => (
          //             <PhoneCard option={phone} />
          //           ))}
          //           {option.properties.email.map((email) => (
          //             <EmailCard option={email} />
          //           ))}
          //         </div>
          //       )}
          //     </div>
          //   </Stack>
          // </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            margin="none"
            sx={{
              m: 0,
              p: 0,
              '& .MuiInputBase-root': {
                height: '40px',
              },
            }}
            placeholder="Search"
            slotProps={{
              ...params.InputProps,
              input: {
                type: 'search',
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.primary' }}>
                    <Search color='primary' />
                  </InputAdornment>
                ),
              }
            }}
          />
        )}
      />
    </Box>
  )
}

export default SearchBar;
