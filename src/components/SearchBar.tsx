import { Box } from '@mui/system'
import { Autocomplete, Collapse, TextField } from '@mui/material'
import { Search } from 'react-flaticons'
import Stack from '@mui/material/Stack'
import { useState } from 'react'

const results = [
  {
    label: 'John Well',
    description: 'Description for option 1',
    properties: {
      well_type: 'Production',
    },
    group: 'Wells',
  },
  {
    label: "Doe's well",
    description: 'Description for option 2',
    properties: {
      well_type: 'Observation',
    },
    group: 'Wells',
  },
  {
    label: 'NM-0912',
    description: 'Description for option 3',
    properties: {
      well_type: 'Irrigation',
    },
    group: 'Wells',
  },
  {
    label: 'NM-0912spring',
    description: 'Description for option 1',
    properties: {},
    group: 'Springs',
  },
  {
    label: 'NM-0912a',
    description: 'Description for option 1',
    properties: {},
    group: 'Springs',
  },
  {
    label: "Doe's spring",
    description: 'Description for option 2',
    properties: {},
    group: 'Springs',
  },
  {
    label: 'John Doe',
    description: 'Description for option 1',
    properties: {
      address: '123 Main St',
      phone: '555-1234',
    },
    group: 'Contact',
  },
]
export default function SearchBar() {
  // const [options, setOptions] = useState(results.map((option) => option.title))
  const [options, setOptions] = useState(results)
  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    if (!inputValue) {
      // If input is empty, reset options to initial results
      setOptions([])
      return
    }
    // Simulate fetching options based on input
    const fetchedOptions = results.filter((option) =>
      option['label'].toLowerCase().includes(inputValue.toLowerCase())
    )
    setOptions(fetchedOptions)
  }

  return (
    <Box
      sx={{
        background: '#fff',
        flexGrow: 1,
        borderRadius: '5px',
        // paddingTop: '5px',
        paddingRight: '20px',
        margin: '10px',
      }}
    >
      <Autocomplete
        // filterOptions={(x) => x}
        freeSolo
        disableClearable
        options={options}
        onChange={(event, value) => {
          console.log('Selected value:', value)
        }}
        groupBy={(option) => option.group}
        // getOptionLabel={(option) => option.label}
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
          <li {...props} style={{ padding: '10px' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <div>
                <strong>{option.label}</strong>
                <div style={{ color: '#666' }}>{option.description}</div>
                {option.group === 'Wells' && (
                  <div style={{ color: '#666' }}>
                    {option.properties.well_type}
                  </div>
                )}
                {option.group === 'Contact' && (
                  <div style={{ color: '#666' }}>
                    {option.properties.address} - {option.properties.phone}
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
              // background: '#fff',
              borderRadius: '10px',
              margin: '10px',
              // padding: '10px',
            }}
            onChange={handleInput}
            label="Search"
            slotProps={{
              input: {
                ...params.InputProps,
                type: 'search',
              },
            }}
          />
        )}
      />
    </Box>
  )
}
