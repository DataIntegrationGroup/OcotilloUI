import { Box } from '@mui/system'
import { Autocomplete, Collapse, TextField, Card, Chip, InputAdornment, Typography } from '@mui/material'
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

type Address = {
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip_code: string;
  type: string;
};
type Phone = { phone_number: string; type: string };
type Email = { email: string; type: string };

type ContactProp =
  | (Address & { category: 'address' })
  | (Phone & { category: 'phone' })
  | (Email & { category: 'email' });

function flattenContactProps(props: {
  address?: Address[];
  phone?: Phone[];
  email?: Email[];
}): ContactProp[] {
  return [
    ...(props.address ?? []).map((a) => ({ ...a, category: 'address' as const })),
    ...(props.phone ?? []).map((p) => ({ ...p, category: 'phone' as const })),
    ...(props.email ?? []).map((e) => ({ ...e, category: 'email' as const })),
  ];
}

export const searchService = async (query: string) => {
  if (!query) return [];

  return results.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );
}

const SearchResultCard = ({ property }: { property: ContactProp }) => {
  return (
    <Card sx={{ p: 1, m: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Chip size="small" label={property.type} />
        {property.category === 'address' && (
          <Typography variant="body2">
            {property.address_line_1}, {property.address_line_2}, {property.city},{' '}
            {property.state} {property.zip_code}
          </Typography>
        )}
        {property.category === 'phone' && (
          <Typography variant="body2">{property.phone_number}</Typography>
        )}
        {property.category === 'email' && (
          <Typography variant="body2">{property.email}</Typography>
        )}
      </Stack>
    </Card>
  );
};

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
        options={searchQuery?.data ?? results}
        getOptionLabel={(option) =>
          typeof option === 'string'
            ? option               // user‑typed string
            : option.label ?? ''   // your object’s label
        }
        isOptionEqualToValue={(option, value) =>
          typeof value === 'string'
            ? option.label === value              // matching a freeSolo string
            : option.label === (value as any).label // matching an object
        }

        // control the text field
        inputValue={searchInput}
        onInputChange={(_, newInput) => {
          setSearchInput(newInput);
        }}

        // control the selected value
        value={selectedValue}
        onChange={(_, newValue) => {
          setSelectedValue(newValue);
        }}

        openOnFocus
        disableClearable
        freeSolo
        groupBy={(option) => option?.group}
        renderGroup={(params) => (
          <Collapse in={Boolean(params.children)} timeout="auto">
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
        renderOption={(props, option) => {
          // for non-Contacts just render the label + chips
          if (option.group !== 'Contacts') {
            return (
              <li {...props} key={option.label} style={{ padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography sx={{ display: 'block' }} variant='subtitle1' component="div">{option.label}</Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    mt: 0.5,
                    width: '100%'
                  }}
                >
                  <Typography variant='body1'>{option.description}</Typography>
                  {option.properties.well_type && (
                    <Chip size="small" label={option.properties.well_type} sx={{ ml: 1 }} />
                  )}
                  {option.properties.county && (
                    <Chip size="small" label={option.properties.county} sx={{ ml: 1 }} />
                  )}
                </Box>
              </li>
            );
          }

          // for Contacts, flatten & render one card per sub-property
          const contactProps = flattenContactProps(option.properties);

          return (
            <li {...props} key={option.label} style={{ width: '100%' }}>
              <Typography variant="subtitle2">{option.label}</Typography>
              {contactProps.map((prop, i) => (
                <SearchResultCard key={`${option.label}-${prop.category}-${i}`} property={prop} />
              ))}
            </li>
          );
        }}
        renderInput={params => <TextField {...params}
          placeholder="Search"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Search color="primary" />
              </InputAdornment>
            ),
          }}
        />}
      />
    </Box >
  )
}

export default SearchBar;
