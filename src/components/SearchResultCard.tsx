import { Chip, Box } from '@mui/material'

export const AddressCard = ({ option }) => (
  <Chip size="small" color="default" label={`Address: ${option}`} />
)

export const PhoneCard = ({ option }) => (
  <Chip size="small" color="default" label={`Phone: ${option}`} />
)

export const EmailCard = ({ option }) => (
  <Chip size="small" color="default" label={`Email: ${option}`} />
)

export const WellCard = ({ option }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 2,
      }}
    >
      {option.properties.well_type ? (
        <Chip
          size="small"
          color="default"
          label={option.properties.well_type}
        />
      ) : null}
      {option.properties.hole_depth ? (
        <Chip
          size="small"
          color="default"
          label={`Hole Depth: ${option.properties?.hole_depth} ft`}
        />
      ) : null}
      {option.properties.well_depth ? (
        <Chip
          size="small"
          color="default"
          label={`Well Depth: ${option.properties?.well_depth} ft`}
        />
      ) : null}
    </Box>
  )
}

export const SpringCard = ({ option }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 2,
      }}
    >
      {option.properties.county ? (
        <Chip size="small" color="default" label={option.properties.county} />
      ) : null}
    </Box>
  )
}
