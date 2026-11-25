// @what: Report rail on the well PDF preview page, matching the wells-pdf-preview mockup.
// The Owner Sheet toggle replaces the old export-options panel; it adds page 2.
import {
  Box,
  Chip,
  Divider,
  Paper,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material'

const labelSx: SxProps<Theme> = {
  display: 'block',
  fontWeight: 600,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  color: 'text.secondary',
}

export const ReportRail = ({
  includeOwnerPage,
  onToggleOwnerPage,
}: {
  includeOwnerPage: boolean
  onToggleOwnerPage: (value: boolean) => void
}) => (
  <Paper
    variant="outlined"
    sx={{ width: 312, flexShrink: 0, borderRadius: 2, bgcolor: 'background.paper' }}
  >
    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Report
      </Typography>
    </Box>
    <Box sx={{ p: 2 }}>
      <Typography variant="caption" sx={labelSx}>
        Owner Sheet
      </Typography>
      <Box sx={{ mt: 0.75 }}>
        <Chip
          size="small"
          clickable
          label={includeOwnerPage ? 'On' : 'Off'}
          color={includeOwnerPage ? 'primary' : 'default'}
          variant={includeOwnerPage ? 'filled' : 'outlined'}
          onClick={() => onToggleOwnerPage(!includeOwnerPage)}
          aria-label="Toggle owner sheet"
          aria-pressed={includeOwnerPage}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}
      >
        Adds page 2.
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" sx={labelSx}>
        Report type
      </Typography>
      <Typography variant="body2">Field compilation notes</Typography>
      <Typography variant="caption" sx={{ ...labelSx, mt: 1.5 }}>
        Format
      </Typography>
      <Typography variant="body2">Letter</Typography>
    </Box>
  </Paper>
)
