import { Chip, Box, Stack, Typography } from '@mui/material'
import {
  AssetResult,
  ContactResult,
  WellResult,
} from '@/interfaces/ocotillo/SearchResult'
import { Place, WaterDrop } from '@mui/icons-material'
import { highlight } from '@/utils'

const ThingChip = ({
  thing,
  query,
}: {
  thing: { id: number; label: string; thing_type: string }
  query: string
}) => {
  const isWaterWell = thing.thing_type === 'water well'

  return (
    <Chip
      size="small"
      variant="outlined"
      icon={isWaterWell ? <WaterDrop /> : <Place />}
      label={highlight(thing.label, query)}
    />
  )
}

export const AssetCard = ({
  asset,
  query,
}: {
  asset: Pick<AssetResult, 'properties'>
  query: string
}) => {
  const { storage_service, storage_path, mime_type, size, things } =
    asset.properties

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Chip
          size="small"
          color="default"
          label={<>Storage Path: {highlight(storage_path, query)}</>}
        />
        <Chip size="small" color="default" label={`Size: ${size} MB`} />
        <Chip size="small" color="default" label={`Type: ${mime_type}`} />
        <Chip
          size="small"
          color="default"
          label={`Storage Service: ${storage_service}`}
        />
      </Box>

      {things?.length > 0 && (
        <>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Related wells & springs
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {things?.map((thing) => (
              <Chip
                key={thing}
                size="small"
                variant="outlined"
                label={highlight(thing, query)}
              />
            ))}
          </Box>
        </>
      )}
    </Stack>
  )
}
export const ContactCard = ({
  contact,
  query,
}: {
  contact: Pick<ContactResult, 'properties'>
  query: string
}) => {
  const { address, phone, email, things } = contact.properties

  const hasContactInfo =
    address.length > 0 || phone.length > 0 || email.length > 0

  return (
    <Stack spacing={1}>
      {hasContactInfo && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {address.map((a, i) => (
            <Chip
              key={`${a}-${i}`}
              size="small"
              color="default"
              label={<>Address: {highlight(a, query)}</>}
            />
          ))}
          {phone.map((p, i) => (
            <Chip
              key={`${p}-${i}`}
              size="small"
              color="default"
              label={`Phone: ${p}`}
            />
          ))}
          {email.map((e, i) => (
            <Chip
              key={`${e}-${i}`}
              size="small"
              color="default"
              label={`Email: ${highlight(e, query)}`}
            />
          ))}
        </Box>
      )}

      {things.length > 0 && (
        <>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Related wells & springs
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {things.map((thing) => (
              <ThingChip thing={thing} query={query} />
            ))}
          </Box>
        </>
      )}
    </Stack>
  )
}

export const WellCard = ({
  well,
}: {
  well: Pick<WellResult, 'properties'>
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 2,
      }}
    >
      {well.properties.hole_depth ? (
        <Chip
          size="small"
          color="default"
          label={`Hole Depth: ${well.properties?.hole_depth?.toFixed(2)} ft`}
        />
      ) : null}
      {well.properties.well_depth ? (
        <Chip
          size="small"
          color="default"
          label={`Well Depth: ${well.properties?.well_depth?.toFixed(2)} ft`}
        />
      ) : null}
      {well.properties.well_purposes
        ? well.properties.well_purposes?.map((wp: string) => (
            <Chip size="small" color="default" label={`Purpose: ${wp}`} />
          ))
        : null}
    </Box>
  )
}

export const SpringCard = ({
  spring,
}: {
  spring: Pick<WellResult, 'properties'>
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 2,
      }}
    >
      {spring.properties.thing_type ? (
        <Chip
          size="small"
          color="default"
          label={spring.properties.thing_type}
        />
      ) : null}
    </Box>
  )
}
