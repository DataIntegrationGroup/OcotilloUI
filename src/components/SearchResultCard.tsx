import { Card, Chip, Grid2, Typography } from '@mui/material'
import { Box } from '@mui/system'

export function AddressCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px' }}>
      <Chip size="small" color="default" label={option.type} />
      <Typography variant={'body1'}>
        {option.address_line_1}, {option.address_line_2}, {option.city},{' '}
        {option.state} {option.zip_code}
      </Typography>
    </Card>
  )
}

export function PhoneCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px' }}>
      <Chip size="small" color="default" label={option.type} />
      <Typography variant={'body1'}>{option.phone_number}</Typography>
    </Card>
  )
}

export function EmailCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px' }}>
      <Chip size="small" color="default" label={option.type} />
      <Typography variant={'body1'}>{option.email}</Typography>
    </Card>
  )
}

export function WellCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px', width: '800px' }}>
      <Grid2 container spacing={2}>
        <Grid2 size={6}>
          <Box>
            <Chip
              size="small"
              color="default"
              label={option.properties.well_type}
            />
            <Chip
              size="small"
              color="default"
              label={option.properties.county}
            />
          </Box>
        </Grid2>
        <Grid2 size={6} justifyContent={''}>
          <Box>
            <Chip
              size="small"
              color="default"
              label={option.properties.series.observed_property}
            />
            <Chip
              size="small"
              color={
                option.properties.series.sensor === 'manual'
                  ? 'primary'
                  : 'secondary'
              }
              label={option.properties.series.sensor}
            />
          </Box>
        </Grid2>
      </Grid2>
    </Card>
  )
}

export function SpringCard({ option }) {
  return (
    <Card sx={{ padding: '5px', margin: '5px', width: '800px' }}>
      <Grid2 container spacing={2}>
        <Grid2 size={6}>
          <Box>
            <Chip
              size="small"
              color="default"
              label={option.properties.county}
            />
          </Box>
        </Grid2>
      </Grid2>
    </Card>
  )
}
