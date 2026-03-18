import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { ContentCopy } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'
import { settings } from '@/settings'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const baseApiUrl = trimTrailingSlash(settings.ocotillo_api_url)
const ogcLandingPageUrl = `${baseApiUrl}/ogcapi`
const ogcCollectionsUrl = `${ogcLandingPageUrl}/collections`

const commonCollections = [
  'Water Wells',
  'Springs',
  'Latest Depth to Water',
  'Average TDS',
  'Latest TDS',
]

const docs = {
  arcgis:
    'https://pro.arcgis.com/en/pro-app/latest/help/data/services/use-ogc-api-services.htm',
  qgis: 'https://docs.qgis.org/latest/en/docs/user_manual/working_with_ogc/ogc_client_support.html',
}

export const HelpPage = () => {
  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch (error) {
      console.error('Failed to copy OGC URL', error)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Connect the Ocotillo OGC API to desktop GIS
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Use the Ocotillo OGC API Features endpoint to browse collections in
            ArcGIS Desktop and in QGIS.
          </Typography>
        </Box>

        <Alert severity="warning">
          OGC API layers are usually read-only in desktop GIS. Use them for
          discovery, map display, querying, and export unless your deployment
          explicitly supports editing.
        </Alert>

        <Stack spacing={1}>
          <Typography variant="subtitle2">
            Ocotillo OGC landing page URL
          </Typography>
          <CopyUrlBox value={ogcLandingPageUrl} onCopy={handleCopy} />
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <InstructionCard
              title="ArcGIS Pro / Desktop"
              steps={[
                'Open the Catalog pane and create a new OGC API Server connection.',
                'Paste the Ocotillo landing page URL.',
                'Expand the server connection, choose the collection you want, and add it to the current map.',
                'If ArcGIS prompts for layer options, use extent or maximum-feature limits for large collections.',
              ]}
              href={docs.arcgis}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <InstructionCard
              title="QGIS"
              steps={[
                'Open Data Source Manager.',
                'Choose the WFS / OGC API - Features connection tab.',
                'Create a new connection using the Ocotillo landing page URL.',
                'Connect to the server, select one or more collections, and add them to the map.',
                'For large layers, set paging or feature limits in the connection and layer options.',
              ]}
              note="QGIS expects the OGC API landing page, not a single collection items URL, when you create the server connection."
              href={docs.qgis}
            />
          </Grid>
        </Grid>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Useful Ocotillo endpoints</Typography>
              <EndpointRow
                label="Landing page"
                href={ogcLandingPageUrl}
                description="Use this as the server URL when creating the connection."
              />
              <EndpointRow
                label="Collections"
                href={ogcCollectionsUrl}
                description="Review available collections before connecting from desktop GIS."
              />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">
                Common collections to look for
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {commonCollections.map((collection) => (
                  <Chip
                    key={collection}
                    label={collection}
                    variant="outlined"
                  />
                ))}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Collection names can change by deployment. If you do not see one
                of these, open the{' '}
                <Link href={ogcCollectionsUrl} target="_blank" rel="noreferrer">
                  collections endpoint
                </Link>{' '}
                and use the names published there.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}

const InstructionCard = ({
  title,
  steps,
  note,
  href,
}: {
  title: string
  steps: string[]
  note?: string
  href: string
}) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Stack spacing={2}>
        <Typography variant="h6">{title}</Typography>
        <Stack component="ol" spacing={1} sx={{ pl: 2, m: 0 }}>
          {steps.map((step) => (
            <Typography key={step} component="li" variant="body1">
              {step}
            </Typography>
          ))}
        </Stack>
        <Divider />
        {note ? (
          <Typography variant="body2" color="text.secondary">
            {note}
          </Typography>
        ) : null}
        <Stack spacing={0.5}>
          <Typography variant="body2">Official documentation</Typography>
          <Link
            href={href}
            target="_blank"
            rel="noreferrer"
            sx={{ overflowWrap: 'anywhere' }}
          >
            {href}
          </Link>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
)

const EndpointRow = ({
  label,
  href,
  description,
}: {
  label: string
  href: string
  description: string
}) => (
  <Stack spacing={0.5}>
    <Typography variant="subtitle2">{label}</Typography>
    <Link href={href} target="_blank" rel="noreferrer">
      {href}
    </Link>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Stack>
)

const CopyUrlBox = ({
  value,
  onCopy,
}: {
  value: string
  onCopy: (value: string) => void
}) => (
  <Box sx={{ position: 'relative' }}>
    <Typography
      component="code"
      variant="body2"
      sx={{
        px: 1.25,
        py: 1.25,
        pr: 6,
        borderRadius: 1,
        bgcolor: 'action.hover',
        overflowWrap: 'anywhere',
        display: 'block',
      }}
    >
      {value}
    </Typography>
    <Tooltip title="Copy URL">
      <IconButton
        size="small"
        onClick={() => onCopy(value)}
        sx={{
          position: 'absolute',
          top: 6,
          right: 6,
        }}
        aria-label="Copy OGC landing page URL"
      >
        <ContentCopy fontSize="inherit" />
      </IconButton>
    </Tooltip>
  </Box>
)
