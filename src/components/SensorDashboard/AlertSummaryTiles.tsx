import { Box, Card, CardActionArea, Typography } from '@mui/material'
import type { AlertSeverity } from '@/config/sensor-sources'
import type { AlertSummary } from './sensorAlerts'
import {
  SEVERITY_COLOR,
  SEVERITY_DISPLAY_ORDER,
  SEVERITY_LABEL,
} from './severity'

type Props = {
  summary: AlertSummary
  /** Currently applied severity filter, or null for "no filter". */
  selected: AlertSeverity | null
  onSelect: (severity: AlertSeverity | null) => void
}

const CAPTION: Record<AlertSeverity, string> = {
  critical: 'Need attention now',
  warning: 'Degrading',
  ok: 'Reporting normally',
}

/**
 * Device counts bucketed by worst severity. Clicking a tile filters the
 * device grids below; clicking the active tile clears the filter.
 */
export const AlertSummaryTiles = ({ summary, selected, onSelect }: Props) => (
  <Box
    sx={{
      display: 'grid',
      gap: 2,
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
    }}
  >
    {SEVERITY_DISPLAY_ORDER.map((severity) => {
      const color = SEVERITY_COLOR[severity]
      const isSelected = selected === severity
      return (
        <Card
          key={severity}
          variant="outlined"
          sx={{
            borderColor: isSelected ? `${color}.main` : 'divider',
            borderWidth: isSelected ? 2 : 1,
          }}
        >
          <CardActionArea
            onClick={() => onSelect(isSelected ? null : severity)}
            sx={{ p: 2 }}
          >
            <Typography variant="overline" color="text.secondary">
              {SEVERITY_LABEL[severity]}
            </Typography>
            <Typography
              variant="h3"
              sx={{ color: `${color}.main`, lineHeight: 1.1 }}
            >
              {summary[severity]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {CAPTION[severity]}
            </Typography>
          </CardActionArea>
        </Card>
      )
    })}
  </Box>
)
