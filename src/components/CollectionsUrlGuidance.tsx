import { Lock, OpenInNew, Public } from '@mui/icons-material'
import { Link, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router'
import { INTERNAL_PATH_PREFIX } from '@/components/InternalCollectionsPanel'
import { settings } from '@/settings'

const baseApiUrl = settings.ocotillo_api_url.replace(/\/+$/, '')

const PUBLIC_LANDING_URL = `${baseApiUrl}/ogcapi`
const INTERNAL_LANDING_URL = `${baseApiUrl}/${INTERNAL_PATH_PREFIX}`

type CatalogueTab = 'published' | 'internal'

const EndpointUrl = ({ url }: { url: string }) => (
  <Link
    href={url}
    target="_blank"
    rel="noreferrer"
    underline="hover"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      overflowWrap: 'anywhere',
      fontFamily: 'monospace',
      fontSize: 13,
    }}
  >
    {url}
    <OpenInNew fontSize="inherit" />
  </Link>
)

const PublicCopy = () => (
  <Typography variant="body2" color="text.secondary">
    The bureau's published water and geothermal data, as OGC API Features
    collections. Groundwater covers water wells with their major and minor
    chemistry, latest TDS, depth-to-water trends, and water-elevation points.
    Surface water covers springs, perennial and ephemeral streams, diversions,
    outfalls, lakes and reservoirs, and meteorological stations. Geothermal
    covers wells with bottom-hole and temperature-depth data, heat flow, and
    drill stem tests. Reference covers project areas and the sample locations
    that give the rest context. These are the collections the map layers draw,
    and ArcGIS Pro and QGIS read them with no credentials.
  </Typography>
)

const InternalCopy = () => (
  <Typography variant="body2" color="text.secondary">
    The same water and geothermal data as the public service, without the
    filters the public service applies. A collection here carries the public
    records and the ones held back from release, so treat any result set from it
    as internal. The map layers on this site read the public service, not this
    one. Access to the internal API requires membership in the OGC.Internal
    group. A browser or a desktop GIS client reads it with a personal API key,
    which you generate under{' '}
    <Link component={RouterLink} to="/settings" underline="hover">
      Settings
    </Link>
    . Sharing that key hands the internal catalogue to whoever holds it.
  </Typography>
)

/**
 * What the tab's catalogue holds, where it is served, and who can read it.
 *
 * The two catalogues are separate mounts of the same API and their URLs differ
 * by one path segment, which reads as a typo rather than a boundary. The copy
 * avoids "mount": a reader here is a data consumer, not someone who cares how
 * the API is assembled. Each tab describes only its own catalogue, since
 * naming an endpoint that is not on screen invites the confusion this is meant
 * to settle.
 */
export const CollectionsUrlGuidance = ({ tab }: { tab: CatalogueTab }) => {
  const isInternal = tab === 'internal'
  const Icon = isInternal ? Lock : Public

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.background.default, 0.6),
      })}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
          <Icon
            fontSize="small"
            sx={{ color: isInternal ? '#b45309' : '#0f766e' }}
          />
          <Typography variant="subtitle2">
            {isInternal ? 'Internal service' : 'Public service'}
          </Typography>
        </Stack>
        <EndpointUrl
          url={isInternal ? INTERNAL_LANDING_URL : PUBLIC_LANDING_URL}
        />
        {isInternal ? <InternalCopy /> : <PublicCopy />}
      </Stack>
    </Paper>
  )
}
