import {
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { getSensorSource } from '@/config/sensor-sources'
import type { SensorAlert } from '@/interfaces/sensor-dashboard'
import { SEVERITY_COLOR, SEVERITY_LABEL } from './severity'

type Props = {
  alerts: SensorAlert[]
  /** Cap the list; the grids below carry the full detail. */
  limit?: number
  /**
   * Cap per device. One badly broken logger trips most of its source's rules
   * at once, which would otherwise fill the whole list and hide every other
   * failing device.
   */
  perDeviceLimit?: number
}

/** Worst-first list of everything currently firing, across all sources. */
export const AlertList = ({
  alerts,
  limit = 12,
  perDeviceLimit = 2,
}: Props) => {
  if (alerts.length === 0) {
    return (
      <Alert severity="success" variant="outlined">
        No active alerts -- every configured sensor is reporting within its
        thresholds.
      </Alert>
    )
  }

  // `alerts` arrives worst-first, so taking the first N per device keeps each
  // device's most severe findings.
  const perDevice = new Map<string, number>()
  const shown = alerts
    .filter((alert) => {
      const key = `${alert.sourceId}:${alert.deviceId}`
      const seen = perDevice.get(key) ?? 0
      if (seen >= perDeviceLimit) return false
      perDevice.set(key, seen + 1)
      return true
    })
    .slice(0, limit)

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 0 }}>
        <Typography variant="h6">Active alerts</Typography>
      </CardContent>
      <List dense disablePadding>
        {shown.map((alert, index) => (
          <ListItem key={`${alert.sourceId}-${alert.deviceId}-${alert.ruleId}`}>
            <Stack sx={{ width: '100%' }} spacing={0.5}>
              {index > 0 && <Divider sx={{ mb: 1 }} />}
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  color={SEVERITY_COLOR[alert.severity]}
                  label={SEVERITY_LABEL[alert.severity]}
                />
                <Typography variant="subtitle2">{alert.deviceLabel}</Typography>
                {/* Device labels are only unique within a source -- two
                    vendors can both have a "MG-007", so name the source. */}
                <Typography variant="caption" color="text.secondary">
                  {getSensorSource(alert.sourceId)?.label ?? alert.sourceId}
                </Typography>
              </Stack>
              <ListItemText
                primary={alert.label}
                secondary={alert.detail}
                slotProps={{
                  primary: { variant: 'body2' },
                  secondary: { variant: 'caption' },
                }}
              />
            </Stack>
          </ListItem>
        ))}
      </List>
      {alerts.length > shown.length && (
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="caption" color="text.secondary">
            +{alerts.length - shown.length} more -- see the device tables below.
          </Typography>
        </CardContent>
      )}
    </Card>
  )
}
