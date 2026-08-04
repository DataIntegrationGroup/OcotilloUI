import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import type { SensorSourceView } from '@/hooks/useSensorSources'
import { formatAppDateTime } from '@/utils/Date'
import {
  SEVERITY_COLOR,
  SEVERITY_DISPLAY_ORDER,
  SEVERITY_LABEL,
} from './severity'

type Props = {
  source: SensorSourceView
}

/** Per-vendor health header: is the integration itself up, and its fleet mix. */
export const SourceStatusCard = ({ source }: Props) => {
  const { config, status, summary, pending } = source

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
        >
          <Box>
            <Typography variant="h6">{config.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {config.vendor.name}
              {config.vendor.consoleUrl && (
                <>
                  {' -- '}
                  <Link
                    href={config.vendor.consoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    vendor console
                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                  </Link>
                </>
              )}
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            {SEVERITY_DISPLAY_ORDER.map((severity) => (
              <Chip
                key={severity}
                size="small"
                variant={severity === 'ok' ? 'outlined' : 'filled'}
                color={SEVERITY_COLOR[severity]}
                label={`${summary[severity]} ${SEVERITY_LABEL[severity].toLowerCase()}`}
              />
            ))}
            <Chip
              size="small"
              variant="outlined"
              label={`${pending.length} batch${pending.length === 1 ? '' : 'es'} pending`}
            />
          </Stack>
        </Stack>

        {source.error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            Could not reach {config.vendor.name}: {source.error.message}
          </Alert>
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            {status.lastPolledAt
              ? `Last polled ${formatAppDateTime(status.lastPolledAt)}`
              : 'Not yet polled'}
            {' -- '}
            {status.deviceCount} device{status.deviceCount === 1 ? '' : 's'}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
